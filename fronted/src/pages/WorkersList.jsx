import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Rating,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  CircularProgress,
  Alert,
  AlertTitle,
  IconButton,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  LocationOn,
  Work,
  Phone as PhoneIcon,
  WhatsApp as WhatsAppIcon,
} from "@mui/icons-material";
import { useWorkers } from "../hooks/useWorkers";
import FavoriteButton from "../components/favorites/FavoriteButton.jsx";
import { useClientFavorites } from "../hooks/useFavorites.js";
import { useAuth } from "../context/AuthContext";
import { useActiveProfessions } from "../hooks/useProfessions";

const areas = ["الساحل الأيمن", "الساحل الأيسر"];

// تعيين الصور لكل حرفة
const professionImages = {
  "صباغ": "dyestuff.jpg",
  "كهربائي": "electrician.jpg",
  "سباك": "plumber.jpg",
  "السيراميك": "radnom.jpg",
  "مكيفات": "radnom.jpg",
  "حداد": "radnom.jpg",
  "جبس": "radnom.jpg",
  "عازل حراري": "radnom.jpg"
};

function WorkersList() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Fetch professions dynamically
  const { data: professions, isLoading: professionsLoading } =
    useActiveProfessions();

  const [filters, setFilters] = useState({
    profession_id: "",
    area: "",
    search: "",
    min_rating: "",
    is_available: "",
    sort: "rating",
    order: "DESC",
    page: 1,
    limit: 12,
  });

  const { workers, meta, loading, error } = useWorkers(filters);
  const { data: favorites, isLoading: favoritesLoading } = useClientFavorites();

  // استخراج المهنة من الـ query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const professionFromUrl = params.get("profession");
    if (professionFromUrl) {
      const profession = professions.find((p) => p.name === professionFromUrl);
      if (profession) {
        setFilters((prev) => ({ ...prev, profession_id: profession.id }));
      }
    }
  }, [location]);

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
      page: 1, // Reset to first page on filter change
    }));
  };

  const handleClearFilters = () => {
    setShowOnlyFavorites(false);
    setFilters({
      profession_id: "",
      area: "",
      search: "",
      min_rating: "",
      is_available: "",
      sort: "rating",
      order: "DESC",
      page: 1,
      limit: 12,
    });
  };

  // Filter workers to show only favorites if the filter is active
  const displayedWorkers = React.useMemo(() => {
    console.log("displayedWorkers calculation:", {
      showOnlyFavorites,
      favoritesCount: favorites?.length || 0,
      workersCount: workers?.length || 0,
    });

    if (!showOnlyFavorites || !favorites || favorites.length === 0) {
      return workers;
    }

    // Get favorite worker IDs
    const favoriteWorkerIds = favorites.map((fav) => {
      const workerId = fav.worker_id || fav.worker?.id;
      console.log("Favorite item:", { fav, workerId });
      return workerId;
    });

    console.log("Favorite worker IDs:", favoriteWorkerIds);

    // Filter workers that are in favorites
    const filtered = workers.filter((worker) => {
      const isIncluded = favoriteWorkerIds.includes(worker.id);
      if (isIncluded) {
        console.log("Worker IS favorite:", {
          id: worker.id,
          name: worker.user?.name,
        });
      }
      return isIncluded;
    });

    console.log("Filtered workers count:", filtered.length);
    return filtered;
  }, [showOnlyFavorites, favorites, workers]);

  // Debug favorites
  useEffect(() => {
    if (favorites && favorites.length > 0) {
      console.log("Favorites loaded:", favorites);
      console.log("First favorite structure:", favorites[0]);
      console.log(
        "Favorite worker IDs:",
        favorites.map((fav) => fav.worker_id || fav.worker?.id)
      );
    } else if (favorites) {
      console.log("Favorites is empty array");
    }
  }, [favorites]);

  // Debug workers when favorites filter is active
  useEffect(() => {
    if (showOnlyFavorites && workers.length > 0) {
      console.log(
        "All workers:",
        workers.map((w) => ({ id: w.id, name: w.user?.name }))
      );
      console.log(
        "Displayed workers:",
        displayedWorkers.map((w) => ({ id: w.id, name: w.user?.name }))
      );
    }
  }, [showOnlyFavorites, workers, displayedWorkers]);

  const getProfessionColor = (profession) => {
    const colors = {
      كهربائي: "#ff6b35",
      سباك: "#1a73e8",
      نجار: "#8b4513",
      صباغ: "#ffd700",
      مكيفات: "#00bcd4",
      السيراميك: "#795548",
      جبس: "#e0e0e0",
      ألمنيوم: "#607d8b",
      حداد: "#455a64",
      تنظيف: "#4caf50",
      "عامل للحدائق": "#388e3c",
      "عازل حراري": "#ff9800",
    };
    return colors[profession] || "#666";
  };

  const handleWhatsAppClick = (phone, e) => {
    e.stopPropagation();
    const cleanPhone = phone.replace(/\D/g, "");
    window.open(`https://wa.me/${cleanPhone}`, "_blank");
  };

  const selectedProfession = professions.find(
    (p) => p.id === filters.profession_id
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "background.default",
        pt: 10,
        pb: 4,
      }}
    >
      <Container maxWidth="lg">
        {/* العنوان والبحث */}
        <Box sx={{ mb: 4, textAlign: "center" }}>
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              color: "primary.main",
              background: "linear-gradient(45deg, #0f3057, #3c5889)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {selectedProfession
              ? `حرفيي ${selectedProfession.name}`
              : "جميع الحرفيين"}
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
            اكتشف أفضل الحرفيين المهرة في منطقتك
          </Typography>
        </Box>

        {/* فلترات البحث */}
        <Card
          sx={{
            p: 4,
            mb: 5,
            borderRadius: 3,
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          }}
        >
          <Stack
            direction="row-reverse"
            spacing={2}
            alignItems="center"
            flexWrap="norwo"
            justifyContent="center"
          >
            <TextField
              fullWidth
              placeholder="ابحث عن حرفي..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              InputProps={{
                startAdornment: (
                  <Search sx={{ color: "text.secondary", ml: 1 }} />
                ),
              }}
              sx={{ minWidth: 200 }}
            />

            <FormControl fullWidth sx={{ minWidth: 150 }}>
              <InputLabel>المهنة</InputLabel>
              <Select
                value={filters.profession_id}
                label="المهنة"
                onChange={(e) =>
                  handleFilterChange("profession_id", e.target.value)
                }
              >
                <MenuItem value="">جميع المهن</MenuItem>
                {professions?.map((prof) => (
                  <MenuItem key={prof.id} value={prof.id}>
                    {prof.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ minWidth: 150 }}>
              <InputLabel>المنطقة</InputLabel>
              <Select
                value={filters.area}
                label="المنطقة"
                onChange={(e) => handleFilterChange("area", e.target.value)}
              >
                <MenuItem value="">جميع المناطق</MenuItem>
                {areas.map((area) => (
                  <MenuItem key={area} value={area}>
                    {area}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ minWidth: 150 }}>
              <InputLabel>الحالة</InputLabel>
              <Select
                value={filters.is_available}
                label="الحالة"
                onChange={(e) =>
                  handleFilterChange("is_available", e.target.value)
                }
              >
                <MenuItem value="">الكل</MenuItem>
                <MenuItem value="true">متاح</MenuItem>
                <MenuItem value="false">غير متاح</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ minWidth: 150 }}>
              <InputLabel>التقييم الأدنى</InputLabel>
              <Select
                value={filters.min_rating}
                label="التقييم الأدنى"
                onChange={(e) =>
                  handleFilterChange("min_rating", e.target.value)
                }
              >
                <MenuItem value="">جميع التقييمات</MenuItem>
                <MenuItem value="4">4 ⭐ فما فوق</MenuItem>
                <MenuItem value="3">3 ⭐ فما فوق</MenuItem>
                <MenuItem value="2">2 ⭐ فما فوق</MenuItem>
              </Select>
            </FormControl>

            {user?.role === "client" && (
              <Button
                variant={showOnlyFavorites ? "contained" : "outlined"}
                onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                sx={{ minWidth: 120 }}
                color={showOnlyFavorites ? "primary" : "inherit"}
              >
                {showOnlyFavorites ? "المفضلة فقط ⭐" : "عرض المفضلة"}
              </Button>
            )}

            <Button
              variant="outlined"
              onClick={handleClearFilters}
              sx={{ minWidth: 120 }}
            >
              مسح الكل
            </Button>
          </Stack>
        </Card>

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* نتائج البحث */}
        {!loading && !error && (
          <>
            <Typography
              variant="h6"
              sx={{ mb: 2, color: "text.secondary", direction: "rtl" }}
            >
              {showOnlyFavorites
                ? `${displayedWorkers.length} عامل في المفضلة`
                : `${meta?.total || displayedWorkers.length} حرفي متاح`}
            </Typography>

            {/* No favorites message */}
            {showOnlyFavorites && displayedWorkers.length === 0 && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <AlertTitle>لا يوجد عمال في المفضلة</AlertTitle>
                لم تقم بإضافة أي عامل إلى المفضلة بعد. ابحث عن عمال وأضفهم إلى
                المفضلة بالنقر على أيقونة القلب ❤️
              </Alert>
            )}

            {/* قائمة الحرفيين */}
            <Grid
              container
              spacing={2}
              direction="row-reverse"
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(4, 1fr)",
                },
                gap: 2,
              }}
            >
              {displayedWorkers.map((worker) => {
                // تسجيل بيانات الحرفي
                console.log("🧑‍🔧 بيانات الحرفي:", worker);
                const professionName = worker.profession?.name;
                console.log("🖼️ محاولة تحميل الصورة للحرفة:", professionName);
                return (
                  <Grid
                    item
                    key={worker.id}
                    sx={{ display: "flex", width: "100%" }}
                  >
                    <Card
                      sx={{
                        height: "100%",
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        borderRadius: 3,
                        overflow: "hidden",
                        transition: "all 0.3s ease",
                        cursor: "pointer",
                        "&:hover": {
                          transform: "translateY(-8px)",
                          boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                        },
                      }}
                      onClick={() => navigate(`/worker-detail/${worker.id}`)}
                    >
                      {/* صورة الحرفي */}
                      <Box sx={{ position: "relative" }}>
                        <CardMedia
                          component="img"
                          height="200"
                          image={
                            worker.profession?.name &&
                            professionImages[worker.profession.name]
                              ? `/picture to create account worker/${
                                  professionImages[worker.profession.name]
                                }`
                              : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  worker.user.name
                                )}&background=1976d2&color=fff&size=400`
                          }
                          alt={worker.user.name}
                          sx={{
                            objectFit: "cover",
                            filter: worker.is_available
                              ? "none"
                              : "grayscale(50%)",
                          }}
                        />
                        <Chip
                          label={worker.is_available ? "متاح" : "غير متاح"}
                          color={worker.is_available ? "success" : "default"}
                          size="small"
                          sx={{
                            position: "absolute",
                            top: 12,
                            left: 12,
                          }}
                        />
                        <Chip
                          label={worker.profession.name}
                          sx={{
                            position: "absolute",
                            top: 12,
                            right: 12,
                            backgroundColor: getProfessionColor(
                              worker.profession.name
                            ),
                            color: "white",
                            fontWeight: "bold",
                          }}
                        />
                      </Box>

                      <CardContent
                        sx={{
                          flexGrow: 1,
                          p: 3,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                        }}
                      >
                        {/* اسم الحرفي وتقييمه */}
                        <Box>
                          <Box sx={{ mb: 2 }}>
                            <Typography
                              variant="h6"
                              component="h2"
                              gutterBottom
                              sx={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {worker.user.name}
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                mb: 1,
                              }}
                            >
                              <Rating
                                value={worker.average_rating || 0}
                                precision={0.1}
                                readOnly
                                size="small"
                              />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ ml: 1 }}
                              >
                                ({Number(worker.average_rating || 0).toFixed(1)}
                                )
                              </Typography>
                            </Box>
                          </Box>

                          {/* المعلومات */}
                          <Stack spacing={1} sx={{ mb: 2 }}>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <LocationOn
                                sx={{
                                  fontSize: 18,
                                  color: "text.secondary",
                                  ml: 1,
                                }}
                              />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {worker.user.neighborhood?.name} -{" "}
                                {worker.user.neighborhood?.area}
                              </Typography>
                            </Box>
                            {worker.experience_years && (
                              <Box
                                sx={{ display: "flex", alignItems: "center" }}
                              >
                                <Work
                                  sx={{
                                    fontSize: 18,
                                    color: "text.secondary",
                                    ml: 1,
                                  }}
                                />
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {worker.experience_years} سنوات خبرة
                                </Typography>
                              </Box>
                            )}
                            <Typography variant="body2" color="text.secondary">
                              {worker.total_jobs} مهمة مكتملة
                            </Typography>
                          </Stack>

                          {/* الوصف */}
                          {worker.bio && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                mb: 2,
                                lineHeight: 1.6,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                minHeight: "40px",
                              }}
                            >
                              {worker.bio}
                            </Typography>
                          )}
                        </Box>

                        {/* Contact Buttons */}
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mt: 2,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              alignItems: "center",
                            }}
                          >
                            {worker.contact_phone && (
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `tel:${worker.contact_phone}`;
                                }}
                              >
                                <PhoneIcon />
                              </IconButton>
                            )}
                            {worker.whatsapp_number && (
                              <IconButton
                                size="small"
                                color="success"
                                onClick={(e) =>
                                  handleWhatsAppClick(worker.whatsapp_number, e)
                                }
                              >
                                <WhatsAppIcon />
                              </IconButton>
                            )}
                            <Box onClick={(e) => e.stopPropagation()}>
                              <FavoriteButton workerId={worker.id} />
                            </Box>
                          </Box>
                          <Button
                            variant="contained"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/worker-detail/${worker.id}`);
                            }}
                            disabled={!worker.is_available}
                            sx={{
                              borderRadius: 2,
                              textTransform: "none",
                              fontWeight: "bold",
                              px: 3,
                            }}
                          >
                            عرض الملف
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            {/* حالة عدم وجود نتائج */}
            {workers.length === 0 && (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <Typography variant="h5" color="text.secondary" gutterBottom>
                  لم يتم العثور على حرفيين
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  حاول تغيير معايير البحث الخاصة بك
                </Typography>
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
  );
}

export default WorkersList;
