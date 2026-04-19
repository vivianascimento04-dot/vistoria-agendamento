import { redirect } from 'next/navigation'

export default function LoginRedirect() {
  redirect('/markinvest/admin/login')
}