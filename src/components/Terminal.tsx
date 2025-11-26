// import { useState } from "react";

// function Terminal({ dispatch }: { dispatch: (a: Action) => void }) {
//   const [input, setInput] = useState('');
//   const [history, setHistory] = useState<string[]>([]);

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     const action = parseCommand(input);
//     if (action) {
//       dispatch(action);
//       setHistory([...history, `> ${input}`, `✔ Executed: ${action.type}`]);
//     } else {
//       setHistory([...history, `> ${input}`, `✖ Unknown command`]);
//     }
//     setInput('');
//   };

//   return (
//     <div style={{ background: '#0b0f12', color: '#2aa198', padding: 12, fontFamily: 'IBM Plex Mono' }}>
//       <div style={{ minHeight: 200 }}>
//         {history.map((line, i) => <div key={i}>{line}</div>)}
//       </div>
//       <form onSubmit={handleSubmit}>
//         <span>$ </span>
//         <input
//           value={input}
//           onChange={e => setInput(e.target.value)}
//           style={{ background: 'transparent', border: 'none', color: 'white', width: '80%' }}
//           autoFocus
//         />
//       </form>
//     </div>
//   );
// }
