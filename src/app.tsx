import React, { useEffect } from 'react';
import { Button, Divider, Space, Typography, Upload } from 'antd';
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
                  <Upload
                    multiple={false}
                    accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                    showUploadList={false}
                    customRequest={({ onSuccess }) => setTimeout(() => onSuccess('ok'), 0)}
                    onChange={({ file }) => {
                      if (file.status !== 'done') {
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        const base64 = (e.target.result as string).split(';base64,')[1];
                        store.upload(file.name, base64);
                      };
                      reader.readAsDataURL(file.originFileObj);
                    }}
                  >
                    <Button>Upload an image</Button>
                  </Upload>
                </Space>
                <Divider />
                <ul>
                  {store.path === '' ? null : (
                    <li key="..">
                      <Button
                        type="link"
                        onClick={() =>
                          store.chooseContent({
                            type: 'dir',
                            name: '',
                            path: store.path.split('/').slice(0, -1).join('/'),
                          })
                        }
                      >
                        ⬆️
                      </Button>
                    </li>
                  )}
                  {store.contents.map((content) => (
                    <li key={content.name}>
                      {content.type === 'dir' ? '📁' : ''}
                      <Button type="link" onClick={() => store.chooseContent(content)}>
                        {content.name}
                        {content.type === 'dir' ? '/' : ''}
                      </Button>
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
