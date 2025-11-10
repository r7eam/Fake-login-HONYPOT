import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  Button,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Chip,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import HandymanIcon from "@mui/icons-material/Handyman";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useActiveProfessions } from "../../hooks/useProfessions";
import { useNeighborhoods } from "../../hooks/useNeighborhoods";

const RegisterForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userType, setUserType] = useState("client");
  const [showServiceMessage, setShowServiceMessage] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Fetch professions and neighborhoods from API
  const { data: professions = [], isLoading: professionsLoading } =
    useActiveProfessions();
  const { data: neighborhoods = [], isLoading: neighborhoodsLoading } =
    useNeighborhoods();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const type = params.get("type");
    const redirect = params.get("redirect");

    if (type === "worker") {
      setUserType("worker");
    }

    if (redirect === "service") {
      setShowServiceMessage(true);
    }
  }, [location]);

  const [clientForm, setClientForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  const [workerForm, setWorkerForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    profession: "",
    experience: "",
    city: "",
    price: "",
    description: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const handleUserTypeChange = (event, newType) => {
    if (newType !== null) {
      setUserType(newType);
      if (newType === "worker") {
        navigate("/register?type=worker", { replace: true });
      } else {
        navigate("/register", { replace: true });
      }
    }
  };

  const validateForm = (data) => {
    const newErrors = {};

    if (!data.name) newErrors.name = "الاسم مطلوب";
    if (!data.email) {
      newErrors.email = "البريد الإلكتروني مطلوب";
    } else if (!/\S+@\S+\.\S+/.test(data.email)) {
      newErrors.email = "البريد الإلكتروني غير صالح";
    }
    if (!data.password) {
      newErrors.password = "كلمة المرور مطلوبة";
    } else if (data.password.length < 6) {
      newErrors.password = "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
    }

    if (userType === "worker") {
      if (!data.phone) newErrors.phone = "رقم الهاتف مطلوب";
      if (!data.profession) newErrors.profession = "نوع الحرفة مطلوب";
      if (!data.city) newErrors.city = "المدينة مطلوبة";
      if (!data.experience) newErrors.experience = "سنوات الخبرة مطلوبة";
      if (!data.price) newErrors.price = "سعر الخدمة مطلوب";
    }

    return newErrors;
  };

  const { register } = useAuth();
  const handleSubmit = async (event) => {
    event.preventDefault();
    setApiError("");
    const formData = userType === "client" ? clientForm : workerForm;
    const validationErrors = validateForm(formData);

    if (Object.keys(validationErrors).length === 0) {
      setIsLoading(true);
      try {
        const userData = {
          ...formData,
          role: userType,
        };

        // تسجيل البيانات قبل الإرسال للخادم
        console.log("📤 البيانات المرسلة للخادم:", userData);

        const result = await register(userData);

        if (result.success) {
          navigate("/profile");
        } else {
          setApiError(result.error || "حدث خطأ أثناء إنشاء الحساب");
        }
      } catch (error) {
        console.error("Error submitting form:", error);
        setApiError("حدث خطأ أثناء إرسال النموذج. الرجاء المحاولة مرة أخرى.");
      } finally {
        setIsLoading(false);
      }
    } else {
      setErrors(validationErrors);
    }
  };

  const handleClientChange = (event) => {
    const { name, value } = event.target;
    setClientForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleWorkerChange = (event) => {
    const { name, value } = event.target;
    if (name === "profession") {
      const selectedProfession = professions.find((p) => p.id === value);
      console.log("🧰 التخصص المختار:", selectedProfession?.name);
    }
    setWorkerForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const textFieldStyles = {
    direction: "rtl",
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px",
      "& input": {
        textAlign: "right",
        direction: "rtl",
      },
      "& fieldset": {
        borderRadius: "12px",
        "&.MuiOutlinedInput-notchedOutline": {
          textAlign: "right",
        },
        "& legend": {
          "& span": {
            paddingRight: "35px",
            paddingLeft: "0",
          },
        },
      },
      "&:hover fieldset": {
        borderColor: "primary.main",
      },
    },
    "& .MuiInputLabel-root": {
      right: 14,
      left: "auto",
      transformOrigin: "right",
      "&.MuiInputLabel-shrink": {
        transform: "translate(0, -9.5px) scale(0.999)",
        right: 14,
      },
    },
    "& .MuiInputLabel-outlined": {
      transform: "translate(-4px, 16px) scale(1)",
    },
  };
  const selectStyles = {
    borderRadius: "12px",
    direction: "rtl",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "rgba(0, 0, 0, 0.23)",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "primary.main",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "primary.main",
    },
    "& .MuiSelect-select": {
      paddingTop: "12px",
      paddingBottom: "12px",
      textAlign: "right",
    },
    "& .MuiInputLabel-root": {
      right: 14,
      left: "auto",
      transformOrigin: "right",
      "&.MuiInputLabel-shrink": {
        transform: "translate(0, -9.5px) scale(0.75)",
        right: 14,
      },
    },
    "& .MuiInputLabel-outlined": {
      transform: "translate(-4px, 16px) scale(1)",
    },
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        mt: 8,
        mb: 8,
        direction: "rtl",
        textAlign: "right",
      }}
    >
      <Paper
        elevation={6}
        sx={{
          p: 4,
          borderRadius: "16px",
          background: "linear-gradient(to bottom, #ffffff, #f8f9fa)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        }}
      >
        {showServiceMessage && (
          <Box
            sx={{
              mb: 3,
              p: 2,
              backgroundColor: "#fff3cd",
              borderRadius: "8px",
              border: "1px solid #ffc107",
              textAlign: "center",
            }}
          >
            <Typography
              variant="body1"
              sx={{
                color: "#856404",
                fontWeight: 600,
              }}
            >
              يجب إنشاء حساب أولاً
            </Typography>
          </Box>
        )}

        <Typography
          variant="h4"
          align="center"
          gutterBottom
          sx={{
            fontWeight: 700,
            color: "primary.main",
            mb: 4,
            position: "relative",
            "&::after": {
              content: '""',
              position: "absolute",
              bottom: -10,
              left: "50%",
              transform: "translateX(-50%)",
              width: "60px",
              height: "4px",
              backgroundColor: "primary.main",
              borderRadius: "2px",
            },
          }}
        >
          إنشاء حساب
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 4,
          }}
        >
          <ToggleButtonGroup
            value={userType}
            exclusive
            onChange={handleUserTypeChange}
            aria-label="نوع المستخدم"
            dir="rtl"
            sx={{
              "& .MuiToggleButton-root": {
                border: "2px solid",
                borderColor: "primary.main !important",
                borderRadius: "12px",
                px: 4,
                py: 1.5,
                mx: 1,
                transition: "all 0.3s ease",
                color: "primary.main",
                fontWeight: 600,
                "&:first-of-type": {
                  borderTopLeftRadius: "12px",
                  borderBottomLeftRadius: "12px",
                },
                "&:last-of-type": {
                  borderTopRightRadius: "12px",
                  borderBottomRightRadius: "12px",
                },
                "&.Mui-selected": {
                  backgroundColor: "primary.main",
                  color: "white",
                  borderColor: "primary.main !important",
                  "&:hover": {
                    backgroundColor: "primary.dark",
                  },
                },
                "&:hover": {
                  backgroundColor: "rgba(25, 118, 210, 0.08)",
                },
              },
            }}
          >
            <ToggleButton value="client" aria-label="عميل">
              <PersonIcon sx={{ ml: 1 }} />
              عميل
            </ToggleButton>
            <ToggleButton value="worker" aria-label="حرفي">
              <HandymanIcon sx={{ ml: 1 }} />
              حرفي
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ mb: 4, display: "flex", justifyContent: "center" }}>
          <Chip
            icon={userType === "client" ? <PersonIcon /> : <HandymanIcon />}
            label={userType === "client" ? "حساب عميل" : "حساب حرفي"}
            color="primary"
            sx={{
              py: 2.5,
              px: 2,
              borderRadius: "12px",
              "& .MuiChip-icon": {
                fontSize: "1.5rem",
              },
              "& .MuiChip-label": {
                fontSize: "1rem",
                fontWeight: 600,
              },
            }}
          />
        </Box>

        <form onSubmit={handleSubmit}>
          {apiError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {apiError}
            </Alert>
          )}

          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <TextField
              fullWidth
              label="الاسم"
              name="name"
              value={userType === "client" ? clientForm.name : workerForm.name}
              onChange={
                userType === "client" ? handleClientChange : handleWorkerChange
              }
              error={Boolean(errors.name)}
              helperText={errors.name}
              sx={textFieldStyles}
            />

            <TextField
              fullWidth
              label="البريد الإلكتروني"
              name="email"
              type="email"
              value={
                userType === "client" ? clientForm.email : workerForm.email
              }
              onChange={
                userType === "client" ? handleClientChange : handleWorkerChange
              }
              error={Boolean(errors.email)}
              helperText={errors.email}
              sx={textFieldStyles}
            />

            <TextField
              fullWidth
              label="كلمة المرور"
              name="password"
              type={showPassword ? "text" : "password"}
              value={
                userType === "client"
                  ? clientForm.password
                  : workerForm.password
              }
              onChange={
                userType === "client" ? handleClientChange : handleWorkerChange
              }
              error={Boolean(errors.password)}
              helperText={errors.password}
              sx={textFieldStyles}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                    >
                      {showPassword ? (
                        <VisibilityOffIcon />
                      ) : (
                        <VisibilityIcon />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="رقم الهاتف"
              name="phone"
              value={
                userType === "client" ? clientForm.phone : workerForm.phone
              }
              onChange={
                userType === "client" ? handleClientChange : handleWorkerChange
              }
              error={Boolean(errors.phone)}
              helperText={errors.phone}
              sx={textFieldStyles}
            />

            {userType === "worker" && (
              <>
                <FormControl fullWidth error={Boolean(errors.profession)}>
                  <InputLabel
                    sx={{ right: 44, left: "auto", transformOrigin: "right" }}
                  >
                    نوع الحرفة
                  </InputLabel>
                  <Select
                    name="profession"
                    value={workerForm.profession}
                    onChange={handleWorkerChange}
                    disabled={professionsLoading}
                    sx={selectStyles}
                  >
                    {professionsLoading ? (
                      <MenuItem disabled>
                        <CircularProgress size={20} /> جاري التحميل...
                      </MenuItem>
                    ) : professions.length === 0 ? (
                      <MenuItem disabled>لا توجد حرف متاحة</MenuItem>
                    ) : (
                      professions.map((profession) => (
                        <MenuItem
                          key={profession.id}
                          value={profession.id}
                          dir="rtl"
                        >
                          {profession.name}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  {errors.profession && (
                    <FormHelperText>{errors.profession}</FormHelperText>
                  )}
                </FormControl>

                <TextField
                  fullWidth
                  label="سنوات الخبرة"
                  name="experience"
                  type="number"
                  value={workerForm.experience}
                  onChange={handleWorkerChange}
                  error={Boolean(errors.experience)}
                  helperText={errors.experience}
                  sx={textFieldStyles}
                />

                <FormControl fullWidth error={Boolean(errors.city)}>
                  <InputLabel
                    sx={{ right: 44, left: "auto", transformOrigin: "right" }}
                  >
                    المنطقة
                  </InputLabel>
                  <Select
                    name="city"
                    value={workerForm.city}
                    onChange={handleWorkerChange}
                    disabled={neighborhoodsLoading}
                    sx={selectStyles}
                  >
                    {neighborhoodsLoading ? (
                      <MenuItem disabled>
                        <CircularProgress size={20} /> جاري التحميل...
                      </MenuItem>
                    ) : neighborhoods.length === 0 ? (
                      <MenuItem disabled>لا توجد مناطق متاحة</MenuItem>
                    ) : (
                      [
                        <MenuItem
                          key="label-right"
                          disabled
                          sx={{ fontWeight: "bold", color: "primary.main" }}
                        >
                          الساحل الأيمن
                        </MenuItem>,
                        ...neighborhoods
                          .filter((n) => n.area === "الساحل الأيمن")
                          .map((neighborhood) => (
                            <MenuItem
                              key={neighborhood.id}
                              value={neighborhood.id}
                              dir="rtl"
                              sx={{ pl: 4 }}
                            >
                              {neighborhood.name}
                            </MenuItem>
                          )),
                        <MenuItem
                          key="label-left"
                          disabled
                          sx={{
                            fontWeight: "bold",
                            color: "primary.main",
                            mt: 1,
                          }}
                        >
                          الساحل الأيسر
                        </MenuItem>,
                        ...neighborhoods
                          .filter((n) => n.area === "الساحل الأيسر")
                          .map((neighborhood) => (
                            <MenuItem
                              key={neighborhood.id}
                              value={neighborhood.id}
                              dir="rtl"
                              sx={{ pl: 4 }}
                            >
                              {neighborhood.name}
                            </MenuItem>
                          )),
                      ]
                    )}
                  </Select>
                  {errors.city && (
                    <FormHelperText>{errors.city}</FormHelperText>
                  )}
                </FormControl>

                <TextField
                  fullWidth
                  label="سعر الخدمة التقريبي"
                  name="price"
                  value={workerForm.price}
                  onChange={handleWorkerChange}
                  error={Boolean(errors.price)}
                  helperText={errors.price}
                  sx={textFieldStyles}
                />

                <TextField
                  fullWidth
                  label="نبذة عن الخدمة"
                  name="description"
                  multiline
                  rows={4}
                  value={workerForm.description}
                  onChange={handleWorkerChange}
                  error={Boolean(errors.description)}
                  helperText={errors.description}
                  sx={textFieldStyles}
                />
              </>
            )}

            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              disabled={isLoading}
              sx={{
                mt: 2,
                py: 1.5,
                fontSize: "1.1rem",
                fontWeight: 600,
                borderRadius: "12px",
                backgroundColor: "primary.main",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                transition: "all 0.3s ease",
                "&:hover": {
                  backgroundColor: "primary.dark",
                  boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              {isLoading ? <CircularProgress size={24} /> : "إنشاء حساب"}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};
export default RegisterForm;
