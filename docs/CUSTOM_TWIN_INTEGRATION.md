# Custom Twin Engine - Integration Guide

## Overview

Este documento describe cómo integrar el motor custom del gemelo digital en el componente `avatar-chat`.

---

## Archivos Creados

### Backend (Server)
| Archivo | Función |
|---------|---------|
| `models/knowledgeVector.js` | Modelo para embeddings vectoriales |
| `services/ragService.js` | RAG con OpenAI embeddings + MongoDB Vector Search |
| `services/ttsService.js` | OpenAI TTS (gpt-4o-mini-tts) |
| `services/customTwinEngine.js` | Motor principal con Gemini 2.5 Flash |
| `services/liveAvatarWebSocket.js` | Cliente WebSocket LiveAvatar Custom Mode |
| `controllers/customTwin.js` | API REST (7 endpoints) |

### Frontend (Client)
| Archivo | Función |
|---------|---------|
| `api/customTwin.ts` | Cliente API TypeScript |
| `hooks/useCustomTwinEngine.ts` | Hook React para el motor custom |

---

## Pasos de Integración en avatar-chat

### 1. Importar el hook
```typescript
import { useCustomTwinEngine, useEngineMode } from '../../hooks/useCustomTwinEngine';
```

### 2. Verificar modo del motor
```typescript
const { engineMode, isLoading: engineLoading } = useEngineMode(professionalId);
const isCustomMode = engineMode === 'CUSTOM';
```

### 3. Inicializar el hook (solo en modo CUSTOM)
```typescript
const customEngine = useCustomTwinEngine({
    professionalId,
    chatId: currentChatId || '',
    clientId: currentUser?._id || '',
    enabled: isCustomMode && !!currentChatId,
    onQuickRepliesUpdated: (replies) => {
        // Actualizar las quick replies en la UI
        setDynamicQuickReplies(replies);
    },
    onEscalationNeeded: (reason) => {
        // Mostrar diálogo de escalación
        setActiveInfoBubble('escalation');
    },
});
```

### 4. Modificar el handleSend
```typescript
const handleSend = async () => {
    const messageText = inputText.trim();
    if (!messageText) return;
    
    // Añadir mensaje del usuario
    addUserMessage(messageText);
    setInputText('');
    
    if (isCustomMode) {
        // Usar motor custom
        const response = await customEngine.sendMessage(messageText);
        if (response) {
            addTwinMessage(response.content);
        }
    } else {
        // Usar LiveAvatar FULL mode (comportamiento actual)
        sendTextToAvatarRef.current?.(messageText);
    }
};
```

### 5. Quick Replies Dinámicas
Crear un nuevo estado para quick replies dinámicas:
```typescript
const [dynamicQuickReplies, setDynamicQuickReplies] = useState<string[]>(QUICK_REPLIES);

// En el render, usar dynamicQuickReplies en lugar de QUICK_REPLIES
```

### 6. LiveAvatar Session (modo CUSTOM)
Cuando se inicia una sesión en modo CUSTOM:
```typescript
if (isCustomMode && sessionId && sessionToken) {
    await customTwinApi.startSession(
        professionalId,
        currentChatId,
        sessionId,
        sessionToken
    );
}
```

---

## Variables de Entorno Requeridas (Server)

```env
# OpenAI (TTS + Embeddings)
OPENAI_API_KEY=sk-...

# Google AI (Gemini)
GOOGLE_AI_API_KEY=...

# LiveAvatar WebSocket
LIVEAVATAR_WS_URL=wss://api.liveavatar.com/ws
```

---

## MongoDB Atlas Vector Index

Crear el índice cuando la colección `knowledgevectors` exista:

```json
{
  "name": "knowledge_vector_index",
  "type": "vectorSearch",
  "fields": [
    { "type": "vector", "path": "embedding", "numDimensions": 1536, "similarity": "cosine" },
    { "type": "filter", "path": "professionalId" },
    { "type": "filter", "path": "category" }
  ]
}
```

---

## Testing

1. Cambiar un profesional a modo CUSTOM:
```
PUT /api/custom-twin/{professionalId}/engine-mode
Body: { "engineMode": "CUSTOM" }
```

2. Sincronizar conocimiento:
```
POST /api/custom-twin/{professionalId}/knowledge/sync
```

3. Probar mensaje:
```
POST /api/custom-twin/{professionalId}/message
Body: { "message": "Hola", "chatId": "...", "clientId": "..." }
```
