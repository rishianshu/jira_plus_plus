import { useState } from "react";
import { gql, useMutation } from "@apollo/client";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { useAuth } from "../../providers/AuthProvider";

const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        email
        displayName
        role
      }
    }
  }
`;

export function LoginCard() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [loginMutation, { loading }] = useMutation(LOGIN_MUTATION, {
    onError: (error) => {
      setFormError(error.message);
    },
    onCompleted: (data) => {
      if (!data?.login) {
        setFormError("Unexpected response from server.");
        return;
      }

      auth.login(data.login.token, data.login.user);
      navigate("/admin");
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!email || !password) {
      setFormError("Email and password are required.");
      return;
    }

    void loginMutation({
      variables: {
        input: {
          email,
          password,
        },
      },
    });
  };

  return (
    <section className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-200/60 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-slate-950/40">
      <header className="mb-6 space-y-1">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Admin Sign In</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Use the admin credentials seeded via environment variables. Contact your Jira++ admin to request access.
        </p>
      </header>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="space-y-2 text-sm">
          <span className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200">
            <Mail className="h-4 w-4 text-slate-400 dark:text-slate-400" />
            Email
          </span>
          <input
            type="email"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-slate-600"
            placeholder="admin@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200">
            <Lock className="h-4 w-4 text-slate-400 dark:text-slate-400" />
            Password
          </span>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-slate-600"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>
        {formError ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {formError}
          </p>
        ) : null}
        <Button
          type="submit"
          className="w-full justify-center"
          disabled={loading}
          variant="default"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Sign in
        </Button>
      </form>
      <footer className="mt-4 text-xs text-slate-500 dark:text-slate-400">
        Forgot your password? Rotate the admin credentials in `.env` and restart the API service.
      </footer>
    </section>
  );
}
