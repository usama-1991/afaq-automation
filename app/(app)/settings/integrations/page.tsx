import { redirect } from 'next/navigation';

export default function SettingsIntegrationsRedirect() {
  redirect('/settings?tab=Integrations');
}
