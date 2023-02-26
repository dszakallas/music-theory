import Paper from '@mui/material/Paper';
import React from 'react';
import { State, useState } from './util';

export type ViewState = {
  mainWindow: State<any>;
};

const defaultMainWindow = <div>Main window is empty!</div>;

export const useViewState = (): ViewState => {
  const mainWindow = useState(defaultMainWindow);
  return {
    mainWindow
  };
};

export default function MainWindow(props: {view: ViewState}) {
  const { view } = props; 
  return <Paper>{view.mainWindow.value}</Paper>; 
}
