import axios from "axios";
import { API_BASE_URL } from "../../config/api";

const api = axios.create({

  baseURL:
  API_BASE_URL
  // for local development
    // "http://localhost:8080"

});

export default api;