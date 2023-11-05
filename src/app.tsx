import React, { useEffect, useState } from 'react';
import { Button, Divider, Input, Modal, Popconfirm, Space, Tooltip, Typography, Upload } from 'antd';
import { auto } from 'manate/react';
import {
  DeleteOutlined,
  CopyOutlined,
  ReloadOutlined,
  UploadOutlined,
  FolderOpenOutlined,
  FolderAddOutlined,
  RollbackOutlined,
} from '@ant-design/icons';

import type { Store, Token } from './store';
import CONSTS from './constants';

const { Title, Text } = Typography;

const App = (props: { store: Store }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState('mkdir');
  const [modalVal, setModalVal] = useState('');
  const [modalTitle, setModalTitle] = useState('');

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
        <Modal
          open={isModalOpen}
          title={modalTitle}
          onOk={() => {
            setIsModalOpen(false);
            if (modalAction === 'mkdir') {
              store.mkdir(modalVal.trim());
            }
          }}
          onCancel={() => setIsModalOpen(false)}
        >
          <Input
            value={modalVal}
            onChange={(e) => {
              setModalVal(e.target.value);
            }}
          />
        </Modal>
        <Title>Image Hosting by GitHub Pages</Title>
        {store.token === undefined ? (
          <Button size="large" block type="primary" onClick={() => global.ipc.invoke(CONSTS.LOGIN_TO_ELECTRON)}>
            Login via GitHub
          </Button>
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
                  <Tooltip title="refresh">
                    <Button icon={<ReloadOutlined />} onClick={() => store.refresh()} />
                  </Tooltip>
                  <Tooltip title="new folder">
                    <Button
                      icon={<FolderAddOutlined />}
                      onClick={() => {
                        setModalTitle('New Folder');
                        setModalVal('');
                        setIsModalOpen(true);
                        setModalAction('mkdir');
                      }}
                    />
                  </Tooltip>
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
                    <Tooltip title="upload">
                      <Button icon={<UploadOutlined />} />
                    </Tooltip>
                  </Upload>
                </Space>
                <Divider />
                <ul>
                  {store.path === '' ? null : (
                    <li key="..">
                      <Tooltip title="go to parent folder">
                        <Button
                          type="link"
                          onClick={() =>
                            store.chooseContent({
                              type: 'dir',
                              path: store.path.split('/').slice(0, -1).join('/'),
                            })
                          }
                          icon={<RollbackOutlined />}
                        />
                      </Tooltip>
                    </li>
                  )}
                  {store.contents.map((content) => (
                    <li key={content.name}>
                      <Space>
                        <Text
                          editable={{
                            onChange: (newPath) => store.rename(content, newPath),
                            text: content.path,
                            tooltip: 'rename',
                          }}
                        >
                          {content.name}
                          {content.type === 'dir' ? '/' : ''}
                        </Text>
                        <Tooltip title={content.type === 'dir' ? 'open folder' : 'copy URI'}>
                          <Button
                            type="link"
                            onClick={() => store.chooseContent(content)}
                            icon={content.type === 'dir' ? <FolderOpenOutlined /> : <CopyOutlined />}
                          />
                        </Tooltip>
                        <Popconfirm
                          title={`Delete the ${content.type === 'dir' ? 'folder' : 'file'}`}
                          description={`Are you sure to delete this ${content.type === 'dir' ? 'folder' : 'file'}?`}
                          onConfirm={() => {
                            store.delete(content);
                          }}
                        >
                          <Button
                            type="link"
                            danger
                            icon={
                              <Tooltip title="delete">
                                <DeleteOutlined />
                              </Tooltip>
                            }
                          />
                        </Popconfirm>
                      </Space>
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
