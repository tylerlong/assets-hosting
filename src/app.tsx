import React, { useEffect } from 'react';
import { Button, Typography } from 'antd';
import { auto } from 'manate/react';

import type { Store, Token } from './store';
import CONSTS from './constants';

const { Title } = Typography;

const App = (props: { store: Store }) => {
  useEffect(() => {
    const removeListner = global.ipc.on(CONSTS.LOGIN_TO_WEB, (event: any, token: Token) => {
      console.log(token);
      props.store.token = token;
    });
    return () => {
      removeListner();
    };
  }, []);
  const render = () => {
    const { store } = props;
    return (
      <>
        <Title>Image Hosting by GitHub Pages</Title>
        {store.token === undefined ? (
          <Button onClick={() => global.ipc.invoke(CONSTS.LOGIN_TO_ELECTRON)}>Login via GitHub</Button>
        ) : (
          <Title level={2}>Welcome!</Title>
        )}
      </>
    );
  };
  return auto(render, props);
};

export default App;
