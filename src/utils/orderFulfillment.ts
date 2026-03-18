export const fulfillmentLabels: Record<string, string> = {
  'aguardando-envio': 'Aguardando envio',
  'separando': 'Separando',
  'postado': 'Postado',
  'entregue': 'Entregue',
};

export const fulfillmentBadgeClasses: Record<string, string> = {
  'aguardando-envio': 'bg-gray-100 text-gray-600',
  'separando': 'bg-blue-100 text-blue-600',
  'postado': 'bg-purple-100 text-purple-600',
  'entregue': 'bg-emerald-100 text-emerald-600',
};

export const getTrackingLink = (trackingCode?: string, trackingUrl?: string) => {
  if (trackingUrl) return trackingUrl;
  if (!trackingCode) return '';
  return `https://melhorrastreio.com.br/rastreio/${encodeURIComponent(trackingCode)}`;
};
