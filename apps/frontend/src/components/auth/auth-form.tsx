import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { extractApiError } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Informe a senha'),
})

const registerSchema = z
  .object({
    first_name: z.string().min(1, 'Informe o nome'),
    last_name: z.string().optional(),
    username: z.string().min(1, 'Informe um nome de usuário'),
    email: z.string().email('E-mail inválido'),
    password: z.string().min(8, 'A senha precisa ter ao menos 8 caracteres'),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'As senhas não conferem',
    path: ['password_confirmation'],
  })

type LoginValues = z.infer<typeof loginSchema>
type RegisterValues = z.infer<typeof registerSchema>

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive">{message}</p>
}

export function AuthForm() {
  const { login, register: registerUser } = useAuth()
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [formError, setFormError] = useState<string | null>(null)

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      username: '',
      email: '',
      password: '',
      password_confirmation: '',
    },
  })

  const onLogin = async (values: LoginValues) => {
    setFormError(null)
    try {
      await login(values)
    } catch (error) {
      setFormError(extractApiError(error, 'Não foi possível entrar. Verifique suas credenciais.'))
    }
  }

  const onRegister = async (values: RegisterValues) => {
    setFormError(null)
    try {
      await registerUser(values)
    } catch (error) {
      setFormError(extractApiError(error, 'Não foi possível criar a conta.'))
    }
  }

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => {
        setTab(value as 'login' | 'register')
        setFormError(null)
      }}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">Entrar</TabsTrigger>
        <TabsTrigger value="register">Criar conta</TabsTrigger>
      </TabsList>

      {formError ? (
        <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      <TabsContent value="login" className="mt-4">
        <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="login-email">E-mail</Label>
            <Input id="login-email" type="email" autoComplete="email" {...loginForm.register('email')} />
            <FieldError message={loginForm.formState.errors.email?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="login-password">Senha</Label>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              {...loginForm.register('password')}
            />
            <FieldError message={loginForm.formState.errors.password?.message} />
          </div>
          <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
            {loginForm.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Entrar
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="register" className="mt-4">
        <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="reg-first">Nome</Label>
              <Input id="reg-first" {...registerForm.register('first_name')} />
              <FieldError message={registerForm.formState.errors.first_name?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-last">Sobrenome</Label>
              <Input id="reg-last" {...registerForm.register('last_name')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reg-username">Usuário</Label>
            <Input id="reg-username" autoComplete="username" {...registerForm.register('username')} />
            <FieldError message={registerForm.formState.errors.username?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reg-email">E-mail</Label>
            <Input id="reg-email" type="email" autoComplete="email" {...registerForm.register('email')} />
            <FieldError message={registerForm.formState.errors.email?.message} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="reg-password">Senha</Label>
              <Input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                {...registerForm.register('password')}
              />
              <FieldError message={registerForm.formState.errors.password?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-password2">Confirmar</Label>
              <Input
                id="reg-password2"
                type="password"
                autoComplete="new-password"
                {...registerForm.register('password_confirmation')}
              />
              <FieldError message={registerForm.formState.errors.password_confirmation?.message} />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={registerForm.formState.isSubmitting}>
            {registerForm.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Criar conta
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  )
}
