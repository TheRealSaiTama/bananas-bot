type Props = { provider?: 'gemini' | 'fal' | string }

export default function ProviderBadge({ provider }: Props) {
  if (!provider) return null
  const label = provider === 'gemini' ? 'Gemini' : provider === 'fal' ? 'Fal.ai' : provider
  return (
    <span className="badge" title={`Provider: ${label}`}>{label}</span>
  )
}

