import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAlert } from "../context/AlertContext";
import { useLoader } from "../context/LoaderContext";
import { API_ROUTES } from "../api/apiRoutes"; //
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaIdCard,
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";

// --- Updated Validation Helpers ---
const validateName = (name) => {
  // Only allows alphabets and spaces
  const re = /^[A-Za-z\s]+$/;
  return re.test(String(name));
};

const validateEmail = (email) => {
  // Standard strict email format
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).toLowerCase());
};

const validatePhone = (phone) => {
  // Only allows digits and checks for length between 11 and 13
  const re = /^[0-9]{11,13}$/;
  return re.test(String(phone));
};

const validatePassword = (password) => {
  const re =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return re.test(String(password));
};

const Signup = () => {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { showLoader, hideLoader } = useLoader();
  const [files, setFiles] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    number: "",
    password: "",
    gender: "",
    userType: "",
  });

  const [errors, setErrors] = useState({
    name: null,
    email: null,
    number: null,
    password: null,
    gender: null,
    userType: null,
    files: null,
  });

  useEffect(() => {
    const isNameValid = validateName(formData.name);
    const isEmailValid = validateEmail(formData.email);
    const isPhoneValid = validatePhone(formData.number);
    const isPasswordValid = validatePassword(formData.password);
    const isGenderValid = formData.gender !== "";
    const isUserTypeValid = formData.userType !== "";
    const areFilesValid = files.length === 2;

    setIsFormValid(
      isNameValid &&
        isEmailValid &&
        isPhoneValid &&
        isPasswordValid &&
        isGenderValid &&
        isUserTypeValid &&
        areFilesValid,
    );
  }, [formData, files]);

  const handleValidation = (name, value) => {
    let errorMsg = null;
    switch (name) {
      case "name":
        if (value.trim().length === 0) {
          errorMsg = "Full name is required.";
        } else if (!validateName(value)) {
          errorMsg = "Name should only contain letters and spaces.";
        }
        break;
      case "email":
        if (!validateEmail(value)) {
          errorMsg =
            "Please enter a valid email address (e.g., name@gmail.com).";
        }
        break;
      case "number":
        if (!/^[0-9]*$/.test(value)) {
          errorMsg = "Phone number must contain only digits.";
        } else if (value.length < 11 || value.length > 13) {
          errorMsg = "Phone number must be between 11 and 13 digits.";
        }
        break;
      case "password":
        if (value.length < 8) {
          errorMsg = "Must be at least 8 characters long.";
        } else if (!validatePassword(value)) {
          errorMsg =
            "Must include Uppercase, Lowercase, Number, and Special Character.";
        }
        break;
      default:
        break;
    }
    setErrors((prev) => ({ ...prev, [name]: errorMsg }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Prevent typing numbers in Name field
    if (name === "name" && value !== "" && !/^[A-Za-z\s]*$/.test(value)) return;

    // Prevent typing characters in Phone field
    if (name === "number" && value !== "" && !/^[0-9]*$/.test(value)) return;

    setFormData({ ...formData, [name]: value });
    handleValidation(name, value);
  };

  // Rest of the component handlers (handleFileChange, handleSubmit) remain the same...
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;
    if (selectedFiles.length !== 2) {
      setErrors((prev) => ({
        ...prev,
        files: "Please upload exactly 2 files (CNIC front & back).",
      }));
      setFiles([]);
      return;
    }
    let validFiles = true;
    selectedFiles.forEach((file) => {
      if (!["image/png", "image/jpeg", "application/pdf"].includes(file.type))
        validFiles = false;
    });
    if (!validFiles) {
      setErrors((prev) => ({
        ...prev,
        files: "Invalid file type. Only PNG, JPG, or PDF allowed.",
      }));
      setFiles([]);
    } else {
      setErrors((prev) => ({ ...prev, files: null }));
      setFiles(selectedFiles);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      showAlert("Please correct the errors in the form.", "warning");
      return;
    }
    showLoader();
    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => data.append(key, formData[key]));
      files.forEach((file) => data.append("cnicPhotos", file));

      const response = await axios.post(API_ROUTES.AUTH.SIGNUP, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showAlert(response.data.message || "Signup successful!", "success");
      navigate("/verify-signup-otp", { state: { email: formData.email } });
    } catch (error) {
      showAlert(
        error.response?.data?.message || "Signup failed. Please try again.",
        "error",
      );
    } finally {
      hideLoader();
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">
        <div className="text-center">
          <h2 className="mt-2 text-3xl font-extrabold text-secondary">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">Join Vacant Place today</p>
        </div>

        <form
          className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4"
          onSubmit={handleSubmit}
        >
          {/* Full Name */}
          <div className="col-span-2 md:col-span-1">
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Full Name (as per CNIC)
            </label>
            <div className="relative">
              <FaUser className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 z-10" />
              <input
                type="text"
                name="name"
                required
                className={`pl-10 w-full py-3 border rounded-lg focus:ring-primary focus:border-primary ${errors.name ? "border-red-500" : "border-gray-300"}`}
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            {errors.name && (
              <p className="text-xs text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div className="col-span-2 md:col-span-1">
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Email Address
            </label>
            <div className="relative">
              <FaEnvelope className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 z-10" />
              <input
                type="email"
                name="email"
                required
                className={`pl-10 w-full py-3 border rounded-lg focus:ring-primary focus:border-primary ${errors.email ? "border-red-500" : "border-gray-300"}`}
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-600 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Phone Number */}
          <div className="col-span-2 md:col-span-1">
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Phone Number
            </label>
            <div className="relative">
              <FaPhone className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 z-10" />
              <input
                type="tel"
                name="number"
                required
                maxLength="13" //
                className={`pl-10 w-full py-3 border rounded-lg focus:ring-primary focus:border-primary ${errors.number ? "border-red-500" : "border-gray-300"}`}
                placeholder="03001234567"
                value={formData.number}
                onChange={handleChange}
              />
            </div>
            {errors.number && (
              <p className="text-xs text-red-600 mt-1">{errors.number}</p>
            )}
          </div>

          {/* Password and other fields remain the same... */}
          <div className="col-span-2 md:col-span-1">
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Password
            </label>
            <div className="relative">
              <FaLock className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 z-10" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                className={`pl-10 w-full py-3 pr-10 border rounded-lg focus:ring-primary focus:border-primary ${errors.password ? "border-red-500" : "border-gray-300"}`}
                placeholder="********"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-600 mt-1">{errors.password}</p>
            )}
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              I am a...
            </label>
            <select
              name="userType"
              required
              className="w-full py-3 px-3 border border-gray-300 rounded-lg"
              onChange={handleChange}
              value={formData.userType}
            >
              <option value="" disabled>
                Select User Type
              </option>
              <option value="tenant">Tenant</option>
              <option value="owner">Owner</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              Gender
            </label>
            <div className="flex space-x-6">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  required
                  className="text-primary"
                  onChange={handleChange}
                />
                <span>Male</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  required
                  className="text-primary"
                  onChange={handleChange}
                />
                <span>Female</span>
              </label>
            </div>
          </div>

          <div className="col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Upload CNIC Photos (Front & Back)
            </label>
            <label
              htmlFor="cnic-upload"
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 ${errors.files ? "border-red-400" : "border-gray-300"}`}
            >
              <div className="space-y-1 text-center">
                <FaIdCard className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <span className="relative font-medium text-primary">
                    Upload files
                  </span>
                  <input
                    id="cnic-upload"
                    name="cnicPhotos"
                    type="file"
                    className="sr-only"
                    multiple
                    accept="image/png, image/jpeg, application/pdf"
                    onChange={handleFileChange}
                    required
                  />
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, PDF (Max 2 files). {files.length} selected.
                </p>
              </div>
            </label>
            {errors.files && (
              <p className="text-xs text-red-600 mt-1">{errors.files}</p>
            )}
          </div>

          <div className="col-span-2 mt-6">
            <button
              type="submit"
              disabled={!isFormValid}
              className="w-full py-4 px-4 text-lg font-bold rounded-full text-white bg-primary disabled:bg-gray-400"
            >
              Register
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
