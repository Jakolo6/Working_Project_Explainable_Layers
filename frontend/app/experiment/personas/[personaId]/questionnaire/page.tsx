// Per-persona post-questionnaire page - server component wrapper

import QuestionnaireClient from './QuestionnaireClient'

// Required for static export with dynamic routes
export function generateStaticParams() {
  return [
    { personaId: 'elderly-woman' },
    { personaId: 'young-entrepreneur' },
    { personaId: 'middle-aged-employee' },
  ]
}

export default function QuestionnairePage({ params }: { params: { personaId: string } }) {
  return <QuestionnaireClient personaId={params.personaId} />
}
