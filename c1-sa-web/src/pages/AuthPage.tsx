import { AuthLayout } from '../components/layout/AuthLayout';
import { AuthForm } from '../components/auth/AuthForm';

export const AuthPage = () => {
  return (
    <AuthLayout>
      <AuthForm />
    </AuthLayout>
  );
};