import * as React from 'react';
import { MantineProvider } from '@mantine/core';
import {
  Button,
  Switch,
  Group,
  Input,
  Card,
  Image,
  Text,
  Badge, 
} from '@mantine/core'


function ButtonGroup() {
  return (
    <div>
      <Button key='1'>test</Button>
      <Button key='2'>test</Button>
      <Button key='3'>test</Button>
      <Button key='4'>test</Button>
      <Button key='5'>test</Button>
      <Button key='6'>test</Button>
      <Button key='7'>test</Button>
      <Button key='8'>test</Button>
      <Button key='9'>test</Button>
      <Button key='0'>test</Button>
    </div>
  )
}

function SwitchGroup() {
  return (
    <Group justify="center">
      <Switch size="xs" onLabel="ON" offLabel="OFF" />
      <Switch size="sm" onLabel="ON" offLabel="OFF" />
      <Switch size="md" onLabel="ON" offLabel="OFF" />
      <Switch size="lg" onLabel="ON" offLabel="OFF" />
      <Switch size="xl" onLabel="ON" offLabel="OFF" />
    </Group>
  )
}

function InputGroup() {
  return (
    <div>
      <Input key='1' />
      <Input key='2' />
      <Input key='3' />
      <Input key='4' />
      <Input key='5' />
      <Input key='6' />
      <Input key='7' />
      <Input key='8' />
      <Input key='9' />
      <Input key='0' />
    </div>
  )
}

function CardDemo() {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section>
        <Image
          src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/images/bg-8.png"
          height={160}
          alt="Norway"
        />
      </Card.Section>

      <Group justify="space-between" mt="md" mb="xs">
        <Text fw={500}>Norway Fjord Adventures</Text>
        <Badge color="pink">On Sale</Badge>
      </Group>

      <Text size="sm" c="dimmed">
        With Fjord Tours you can explore more of the magical fjord landscapes with tours and
        activities on and around the fjords of Norway
      </Text>

      <Button color="blue" fullWidth mt="md" radius="md">
        Book classic tour now
      </Button>
    </Card>
  );
}

function SpanGroup() {
  return (
    <div>
      <span key='1' style={{ color: 'red' }}>test</span>
      <span key='2' style={{ color: 'red' }}>test</span>
      <span key='3' style={{ color: 'red' }}>test</span>
      <span key='4' style={{ color: 'red' }}>test</span>
      <span key='5' style={{ color: 'red' }}>test</span>
      <span key='6' style={{ color: 'red' }}>test</span>
      <span key='7' style={{ color: 'red' }}>test</span>
      <span key='8' style={{ color: 'red' }}>test</span>
      <span key='9' style={{ color: 'red' }}>test</span>
      <span key='0' style={{ color: 'red' }}>test</span>
    </div>
  )
}


export default function Component() {
  const [show, setShow] = React.useState(false)

  return (
    <div>
      <button onClick={() => setShow(!show)}>toggle</button>
      {show &&
        <MantineProvider defaultColorScheme='dark'>

          <ButtonGroup />
          <ButtonGroup />
          <ButtonGroup />
          <ButtonGroup />
          <ButtonGroup />

          <SwitchGroup />
          <SwitchGroup />
          <SwitchGroup />
          <SwitchGroup />
          <SwitchGroup />

          <InputGroup />
          <InputGroup />
          <InputGroup />

          <CardDemo />
          <CardDemo />
          <CardDemo />
          <CardDemo />
          <CardDemo />

          <SpanGroup />
          <SpanGroup />
          <SpanGroup />
          <SpanGroup />
          <SpanGroup />
          <SpanGroup />
          <SpanGroup />
          <SpanGroup />
          <SpanGroup />
          <SpanGroup />
          <SpanGroup />
          <SpanGroup />
          <SpanGroup />
          <SpanGroup />
          <SpanGroup />
          <SpanGroup />
          <SpanGroup />
          <SpanGroup />
          <SpanGroup />
          <SpanGroup />

        </MantineProvider>
      }
    </div>
  );
}
