import { useState } from "react";
import API from "../services/api";

export default function Login({ setIsLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
  try {
    const res = await API.post("/auth/login", { email, password });
    localStorage.setItem("token", res.data.token);
    window.location.href = "/dashboard";
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || "Login failed");
  }
};


  return (
    <div className="w-96 p-6 shadow rounded">
      <h2 className="text-xl font-bold mb-4">Login</h2>

      <input className="input" placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <input className="input mt-3" type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />

      <button className="btn mt-4" onClick={login}>Login</button>

      <p className="mt-3 text-sm cursor-pointer text-blue-500" onClick={() => setIsLogin(false)}>
        Create new account
      </p>
    </div>
  );
}
