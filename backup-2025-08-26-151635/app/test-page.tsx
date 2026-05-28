export default function TestPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: 'blue' }}>Page de Test</h1>
      <p>Si vous voyez ce texte en bleu, Next.js fonctionne correctement.</p>
      <div style={{ 
        backgroundColor: 'lightgreen', 
        padding: '10px', 
        margin: '10px 0',
        border: '2px solid green'
      }}>
        <p>Ce bloc devrait avoir un fond vert avec une bordure verte.</p>
      </div>
    </div>
  )
}
