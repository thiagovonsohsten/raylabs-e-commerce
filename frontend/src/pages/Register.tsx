import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import { BrandLogo } from '@/components/BrandLogo';

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    document: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm({ ...form, [key]: value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      navigate('/login');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(msg ?? 'Falha no cadastro.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center">
      <BrandLogo className="mb-8" imgClassName="h-12 w-auto sm:h-14" />
      <div className="card-dark w-full">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-white">Criar conta</h1>
        <p className="mb-6 text-sm text-zinc-400">
          Já tem conta?{' '}
          <Link to="/login" className="font-medium text-[#c77dff] hover:text-[#d4a3ff] hover:underline">
            Entrar
          </Link>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nome" value={form.name} onChange={(v) => update('name', v)} />
          <Field
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(v) => update('email', v)}
          />
          <Field
            label="CPF ou CNPJ"
            value={form.document}
            onChange={(v) => update('document', v)}
            placeholder="111.444.777-35"
          />
          <Field
            label="Senha"
            type="password"
            value={form.password}
            onChange={(v) => update('password', v)}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={loading} className="btn-gradient w-full">
            {loading ? 'Cadastrando...' : 'Criar conta'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-300">{props.label}</label>
      <input
        type={props.type ?? 'text'}
        required
        value={props.value}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
        className="input-dark"
      />
    </div>
  );
}
