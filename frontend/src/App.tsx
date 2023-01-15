import { useState } from 'react'
import './App.css'
import WorkerComponent from './components/WorkerComponent'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <WorkerComponent />
    </div>
  )
}

export default App
