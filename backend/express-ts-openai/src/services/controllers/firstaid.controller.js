import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const AGENT_URL = process.env.AGENT_URL ?? 'http://alex_agent:3500';

const FORBIDDEN_KEYWORDS = [
    'suicidio', 'suicidarme', 'matarme', 'autolesión', 'cortarme', 'hacerme daño',
    'asesinar', 'matar a alguien', 'herir a alguien', 'violencia', 'abuso', 'maltrato',
    'bomba', 'explosivo', 'terrorismo',
    'drogas ilegales', 'sobredosis', 'veneno',
    'pornografía', 'abuso sexual',
];

function isQuestionInappropriate(question) {
    const normalizedQuestion = question.toLowerCase().trim();
    return FORBIDDEN_KEYWORDS.some(keyword => normalizedQuestion.includes(keyword));
}

function buildAsunto(pregunta) {
    const trimmed = pregunta.trim();
    return trimmed.length <= 200 ? trimmed : trimmed.slice(0, 197) + '...';
}

export const askFirstAidQuestion = async (req, res) => {
    const { pregunta } = req.query;

    if (!pregunta || typeof pregunta !== 'string') {
        return res.status(400).json({ message: "El parámetro 'pregunta' es requerido y debe ser texto." });
    }

    if (isQuestionInappropriate(pregunta)) {
        console.warn(`Pregunta bloqueada por filtro de seguridad: "${pregunta}"`);
        return res.status(403).json({
            message: "Tu pregunta no puede ser procesada por motivos de seguridad. Si estás en una situación de emergencia o necesitas ayuda, por favor, contacta a las autoridades locales o a una línea de ayuda especializada."
        });
    }

    try {
        const sessionId = req.usuario?.id_usuario
            ? `firstaid-${req.usuario.id_usuario}-${Date.now()}`
            : `firstaid-anon-${Date.now()}`;

        const agentRes = await fetch(`${AGENT_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId,
                userName: req.usuario?.nombre ?? 'usuario',
                message: pregunta
            })
        });

        if (!agentRes.ok) {
            throw new Error(`Agente respondió con status ${agentRes.status}`);
        }

        const { reply } = await agentRes.json();

        if (req.usuario?.id_usuario) {
            try {
                await prisma.consulta.create({
                    data: {
                        id_usuario:   req.usuario.id_usuario,
                        asunto:       buildAsunto(pregunta),
                        mensaje:      pregunta,
                        respuesta_ia: reply,
                        estado:       'cerrada',
                    }
                });
            } catch (dbErr) {
                console.error('Error al persistir consulta en BD:', dbErr);
            }
        }

        res.status(200).json({
            pregunta,
            respuesta_ia: reply
        });

    } catch (error) {
        console.error("Error en el controlador de primeros auxilios:", error);
        res.status(500).json({ message: "Error interno del servidor al procesar la pregunta." });
    }
};
