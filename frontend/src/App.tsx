import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Layout from "./layouts/Layout";
import Register from "./pages/Register";
//import SignIn from "./pages/SignIn";
//import AddHotel from "./pages/AddArena";
//import { useAppContext } from "./contexts/AppContext";
//import MyHotels from "./pages/MyArena";
//import EditHotel from "./pages/EditArena";
//import Search from "./pages/Search";
//import Detail from "./pages/Detail";
//import Booking from "./pages/Booking";
//import MyBookings from "./pages/MyBookings";
//import Home from "./pages/Home";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route
          path="/register"
          element={
            <Layout>
              <Register />
            </Layout>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;


