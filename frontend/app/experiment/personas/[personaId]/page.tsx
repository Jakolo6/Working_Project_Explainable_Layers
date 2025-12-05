// Individual persona application page - server component wrapper

import PersonaClient from './PersonaClient'

// Generate static params for all persona IDs
export function generateStaticParams() {
  return [
    { personaId: 'elderly-woman' },
    { personaId: 'young-entrepreneur' }
  ]
}

export default function PersonaDetailPage({ params }: { params: { personaId: string } }) {
  return <PersonaClient personaId={params.personaId} />
}
