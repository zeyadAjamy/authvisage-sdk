import { Protected } from "~/components/protected";

export function meta() {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return (
    <Protected>
      <h1>Welcome to the protected home page!</h1>
    </Protected>
  );
}
