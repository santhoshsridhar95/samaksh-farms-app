import { useState } from "react";

export default function LoginPage() {

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const login = () => {

    alert(
      "JWT Login Coming Next"
    );
  };

  return (

    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh"
      }}
    >

      <div
        style={{
          width: "350px",
          border: "1px solid #ccc",
          padding: "20px",
          borderRadius: "10px"
        }}
      >

        <h2>
          Samaksh ERP Login
        </h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          style={{
            width: "100%",
            marginTop: "10px"
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          style={{
            width: "100%",
            marginTop: "10px"
          }}
        />

        <button
          onClick={login}
          style={{
            marginTop: "15px",
            width: "100%"
          }}
        >
          Login
        </button>

      </div>

    </div>
  );
}