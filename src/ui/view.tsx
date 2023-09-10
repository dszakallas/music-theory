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

export default function MainWindow(props: {view: ViewState, style?: React.CSSProperties}) {
  const { view, style } = props; 
  return <Paper style={style}>{view.mainWindow.value}</Paper>; 
}
