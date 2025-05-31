import * as React from 'react'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'

export default function Component() {
  const [show, setShow] = React.useState(false)

  return (
    <div>
      <button onClick={() => setShow(!show)}>test</button>
      <div>
        {show &&
          <>
            <Row />
            <Row />
            <Row />
            <Row />
            <Row />
            <Row />
            <Row />
            <Row />
            <Row />
            <Row />
          </>
        }
      </div>
    </div>
  )
}

function Row() {

  return (
    <div>
      <TextField />
      <TextField />
      <TextField />
      <TextField />
      <TextField />
    </div>
  )
  // return (
  //   <div>
  //     <Button>Test</Button>
  //     <Button>Test</Button>
  //     <Button>Test</Button>
  //     <Button>Test</Button>
  //     <Button>Test</Button>
  //   </div>
  // )
}
