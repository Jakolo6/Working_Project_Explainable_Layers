// Layers display page - server component wrapper

import LayersClient from './LayersClient'

// Generate static params for all persona IDs
export function generateStaticParams() {
  return [
    { personaId: 'elderly-woman' },
    { personaId: 'young-entrepreneur' }
  ]
}

export default function LayersPage({ params }: { params: { personaId: string } }) {
  return <LayersClient personaId={params.personaId} />
}
