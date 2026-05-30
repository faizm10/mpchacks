const memory = new Map();

function getContext(conversationId) {
  if (!conversationId) return null;
  return memory.get(conversationId) || null;
}

function setContext(conversationId, lastContext) {
  if (!conversationId) return;
  memory.set(conversationId, {
    conversationId,
    lastContext,
    updatedAt: new Date().toISOString(),
  });
}

module.exports = {
  getContext,
  setContext,
};
