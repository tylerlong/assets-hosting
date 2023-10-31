import React, { useEffect } from 'react';
import { Button, Divider, Space, Typography } from 'antd';
import { auto } from 'manate/react';

import type { Store, Token } from './store';
import CONSTS from './constants';

const { Title } = Typography;

const App = (props: { store: Store }) => {
  useEffect(() => {
    const removeListner = global.ipc.on(CONSTS.LOGIN_TO_WEB, (event: any, token: Token) => {
      props.store.token = token;
      props.store.init();
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
          <>
            <Title level={3}>{store.repo === undefined ? 'Please choose a repo:' : store.repo.full_name}</Title>

            {store.repo === undefined ? (
              <ul>
                {store.repos.map((repo) => (
                  <li key={repo.full_name}>
                    <Button
                      type="link"
                      onClick={() => {
                        store.chooseRepo(repo);
                      }}
                    >
                      {repo.full_name}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <>
                <Space>
                  <Button>Create a folder</Button>
                  <Button>Upload an image</Button>
                </Space>
                <Divider />
                <ul>
                  {store.contents.map((content) => (
                    <li key={content.name}>
                      {content.name} - {content.type}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </>
    );
  };
  return auto(render, props);
};

export default App;
