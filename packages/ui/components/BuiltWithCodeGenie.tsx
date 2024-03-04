import React from 'react'

export default function BuiltWithCodeGenie() {
  return (
    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'flex-end', marginTop: '2rem', height: '30px'}}>
      <a href='https://codegenie.codes?ref=builtWithCodeGenie' target='_blank' rel='noopener'>
        Built with <img src='https://app.codegenie.codes/built-with-code-genie.webp' style={{width: '32px', margin: '0 5px'}} /> Code Genie
      </a>
    </div>
  )
}