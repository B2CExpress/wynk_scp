

export default function TenantNotFound() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'sans-serif',
        color: '#333',
        gap: '1rem',
      }}
    >
      <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>404</h1>
      <p style={{ fontSize: '1.125rem', textAlign: 'center', maxWidth: 400 }}>
        Este endereço não corresponde a nenhum shopping da plataforma.
      </p>
      <p style={{ fontSize: '0.875rem', color: '#888' }}>
        Verifique se o endereço está correto ou entre em contato com o suporte.
      </p>
    </main>
  )
}

    

//This JSX tag requires the module path 'react/jsx-runtime' to exist, but none could be found. Make sure you have types for the appropriate package installed.
// JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.