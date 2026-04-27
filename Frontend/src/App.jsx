import './App.css'
import { MainRoutes } from './Routes/MainRoutes'
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, Bounce } from 'react-toastify';

function App() {
  return (
    <>
      <MainRoutes />
      <ToastContainer
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Bounce}
      />
    </>
  );
}

export default App;
