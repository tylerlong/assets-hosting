import React, { useEffect } from 'react';
import { Button, Space, Typography } from 'antd';
import { auto } from 'manate/react';

import type { Store } from './store';
import CONSTS from './constants';

const { Text, Title } = Typography;

const App = (props: { store: Store }) => {
  useEffect(() => {
    const removeListner = global.ipc.on(CONSTS.HELLO_TO_WEB, (event: any, args: any) => {
      console.log(args);
    });
    return () => {
      removeListner();
    };
  }, []);
  const render = () => {
    const { store } = props;
    return (
      <>
        <Title>Untitled App</Title>
        <Space>
          <Button
            onClick={() => {
              store.count -= 1;
            }}
          >
            -
          </Button>
          <Text>{store.count}</Text>
          <Button
            onClick={() => {
              store.count += 1;
            }}
          >
            +
          </Button>
          <Button onClick={() => global.ipc.invoke(CONSTS.HELLO_TO_ELECTRON, 'Hello from renderer')}>Hello</Button>
        </Space>
      </>
    );
  };
  return auto(render, props);
};

export default App;
