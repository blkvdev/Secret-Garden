import PasswordForm from '@/components/admin/PasswordForm';
import SettingsForm from '@/components/admin/SettingsForm';
import { getSettings } from '@/lib/store';
import { DEFAULT_TEMPLATE, TEMPLATE_VARIABLES } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const { id: _id, ...s } = await getSettings();
  return (
    <>
      <h1>Configurações</h1>
      {!s.whatsapp && <p className="alert alert-error">⚠️ Configure o número do WhatsApp — sem ele o cliente não consegue finalizar pedidos.</p>}
      <div className="two-col">
        <SettingsForm initial={s} defaultTemplate={DEFAULT_TEMPLATE} variables={TEMPLATE_VARIABLES} />
        <PasswordForm />
      </div>
    </>
  );
}
