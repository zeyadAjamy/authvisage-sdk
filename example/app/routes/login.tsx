import { signInWithFaceAuth } from "~/lib/authvisage";
import { useUser } from "~/contexts/user";
import { Loading } from "~/components/loading";

export default function Login() {
  const { user } = useUser();

  if (user === undefined) {
    // User state is still loading
    return <Loading />;
  }

  return (
    <div>
      <h1>Login</h1>
      <p>Use your face to log in!</p>
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded"
        onClick={() => signInWithFaceAuth()}
      >
        Sign in with Face Authentication
      </button>
    </div>
  );
}
