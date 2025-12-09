// @ts-nocheck
import React, { useState, useEffect } from "react";
import {
  ChevronRight,
  ChevronLeft,
  MapPin,
  User,
  Car,
  Bus,
  Bike,
  CheckCircle,
  Gift,
  Heart,
  AlertTriangle,
  Loader2,
  Info,
} from "lucide-react";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

// --- YOUR REAL FIREBASE KEYS ---
const firebaseConfig = {
  apiKey: "AIzaSyA0AdwggxIkq3zZgU3vZZx77WEI7mW1qDo",
  authDomain: "tesis-soufyan.firebaseapp.com",
  projectId: "tesis-soufyan",
  storageBucket: "tesis-soufyan.firebasestorage.app",
  messagingSenderId: "735092572222",
  appId: "1:735092572222:web:096787cc9c629e293b516f",
  measurementId: "G-1RZFNMD5W9",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const COLLECTION_NAME = "survey_responses"; // Changed to English for consistency, though collection name doesn't affect UI

export default function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [currentPopup, setCurrentPopup] = useState(0);

  const [user, setUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // --- DESIGN SOLUTION: Inject Tailwind CSS ---
  useEffect(() => {
    // This loads styles automatically if not present
    if (!document.getElementById("tailwind-cdn")) {
      const script = document.createElement("script");
      script.id = "tailwind-cdn";
      script.src = "https://cdn.tailwindcss.com";
      document.head.appendChild(script);
    }
  }, []);

  // Anonymous Authentication
  useEffect(() => {
    signInAnonymously(auth).catch((error) => {
      console.error("Auth Error:", error);
    });

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // --- ACADEMIC AND FORMAL MESSAGES (Translated) ---
  const motivationalMessages = [
    {
      icon: Gift,
      message: "Participation Incentive",
      subtitle:
        "Upon completing the study, you will be eligible for a draw for a €50 gift card.",
    },
    {
      icon: Info,
      message: "Study Relevance",
      subtitle:
        "Your answers directly contribute to the analysis of Almería's urban infrastructure.",
    },
    {
      icon: AlertTriangle,
      message: "Regulatory Context",
      subtitle:
        "Research on the impact of the implementation of Low Emission Zones (LEZ) in 2026.",
    },
    {
      icon: Bike,
      message: "Sustainable Alternatives",
      subtitle: "Evaluation of the feasibility of new shared mobility models.",
    },
    {
      icon: CheckCircle,
      message: "Academic Contribution",
      subtitle:
        "This study is part of a bachelor's thesis for FH Aachen University.",
    },
  ];

  // Pop-ups
  useEffect(() => {
    const popupInterval = setInterval(() => {
      setShowPopup(true);
      setCurrentPopup((prev) => (prev + 1) % motivationalMessages.length);
      setTimeout(() => setShowPopup(false), 8000);
    }, 60000);

    const initialPopup = setTimeout(() => {
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 8000);
    }, 15000);

    return () => {
      clearInterval(popupInterval);
      clearTimeout(initialPopup);
    };
  }, []);

  const getUserPath = () => {
    // Safe array check to avoid TS errors
    const vehicles = answers.vehicles || [];
    const hasCar =
      vehicles.includes("car_gas") || vehicles.includes("car_electric");
    const hasOtherVehicle = vehicles.some((v) =>
      ["moto_gas", "moto_electric", "bike", "ebike", "scooter"].includes(v)
    );
    const hasNoVehicle = vehicles.includes("none");
    return { hasCar, hasOtherVehicle, hasNoVehicle };
  };

  const questions = [
    {
      id: "intro",
      type: "intro",
      title: "Academic Study on Urban Mobility in Almería",
      content: `Dear participant,\n\nI am Soufyan Essoubai, a Global Business and Economics student. I am conducting academic research for my bachelor's thesis, aimed at analyzing urban mobility patterns in the province of Almería and identifying opportunities for improvement in transport infrastructure.\n\nThe survey is completely anonymous, and the collected data will be treated with strict confidentiality and used exclusively for academic purposes.\n\nEstimated time: 3-5 minutes.\nI sincerely appreciate your collaboration.`,
    },
    {
      id: "residence",
      question: "Place of habitual residence",
      type: "single",
      icon: MapPin,
      required: true,
      options: [
        { value: "almeria", label: "Almería (city)" },
        { value: "roquetas", label: "Roquetas de Mar" },
        { value: "ejido", label: "El Ejido" },
        { value: "nijar", label: "Níjar" },
        { value: "vicar", label: "Vícar" },
        {
          value: "other",
          label: "Other municipality in the province",
          hasInput: true,
        },
      ],
    },
    {
      id: "age",
      question: "Age range",
      type: "single",
      icon: User,
      required: true,
      options: [
        { value: "<18", label: "Under 18 years" },
        { value: "18-24", label: "18-24 years" },
        { value: "25-34", label: "25-34 years" },
        { value: "35-44", label: "35-44 years" },
        { value: "45-54", label: "45-54 years" },
        { value: "55-64", label: "55-64 years" },
        { value: "65+", label: "65 years or older" },
      ],
    },
    {
      id: "occupation",
      question: "Main occupation",
      subtitle: "Select all options that describe your current situation",
      type: "multiple",
      icon: User,
      required: true,
      options: [
        { value: "student_uni", label: "University student" },
        {
          value: "student_hs",
          label: "Student (Secondary/High School/Vocational)",
        },
        { value: "young_prof", label: "Working professional (< 35 years)" },
        { value: "adult_prof", label: "Working professional (≥ 35 years)" },
        { value: "parent", label: "Dedicated to caring for minor children" },
        { value: "self_employed", label: "Self-employed / Entrepreneur" },
        { value: "retired", label: "Retired / Pensioner" },
        { value: "unemployed", label: "Unemployed / Job seeking" },
        { value: "other", label: "Other situation", hasInput: true },
      ],
    },
    {
      id: "travel_reasons",
      question: "Main reasons for travel",
      subtitle: "Select all relevant options",
      type: "multiple",
      required: true,
      options: [
        { value: "work", label: "Commuting to work" },
        { value: "study", label: "Attending educational institution" },
        { value: "family", label: "Family logistics / Accompanying" },
        { value: "shopping", label: "Shopping and administrative errands" },
        { value: "leisure", label: "Leisure and free time" },
        { value: "sports", label: "Physical activity / Sports" },
        { value: "social", label: "Social visits" },
        { value: "medical", label: "Medical appointments" },
      ],
    },
    {
      id: "proximity",
      question: "Perception of proximity",
      subtitle:
        'What distance do you consider "close" for a habitual trip on foot or by non-motorized means?',
      type: "multiple",
      required: true,
      options: [
        { value: "0-500m", label: "Up to 500 meters" },
        { value: "500m-1km", label: "Between 500 meters and 1 km" },
        { value: "1-3km", label: "Between 1 km and 3 km" },
        { value: "3-5km", label: "Between 3 km and 5 km" },
        { value: "5-10km", label: "Between 5 km and 10 km" },
        { value: ">10km", label: "More than 10 km" },
      ],
    },
    {
      id: "vehicles",
      question: "Personal vehicle ownership",
      subtitle: "Select all vehicles available in your household for your use",
      type: "multiple",
      icon: Car,
      required: true,
      options: [
        { value: "car_gas", label: "Car (Internal Combustion)" },
        { value: "car_electric", label: "Car (Hybrid or Electric)" },
        { value: "moto_gas", label: "Motorcycle / Scooter (Combustion)" },
        { value: "moto_electric", label: "Motorcycle / Scooter (Electric)" },
        { value: "bike", label: "Traditional Bicycle" },
        { value: "ebike", label: "Electric Bicycle (e-bike)" },
        { value: "scooter", label: "Personal Mobility Device (e-scooter)" },
        { value: "none", label: "None" },
      ],
    },
    {
      id: "car_usage",
      question: "Contexts of private vehicle use",
      subtitle: "Select the situations in which you use the car",
      type: "multiple",
      icon: Car,
      required: true,
      showIf: () => getUserPath().hasCar,
      options: [
        { value: "daily_commute", label: "Daily commuting (work/studies)" },
        { value: "long_trips", label: "Intercity trips / Long distance" },
        { value: "weather", label: "Adverse weather conditions" },
        { value: "heavy_load", label: "Transporting cargo" },
        { value: "passengers", label: "Transporting passengers" },
        { value: "long_urban", label: "Long urban trips (>5 km)" },
        {
          value: "short_comfort",
          label: "Short trips (preference for comfort)",
        },
        { value: "no_alternatives", label: "Lack of viable alternatives" },
      ],
    },
    {
      id: "car_frequency",
      question: "Frequency of private vehicle use",
      type: "single",
      required: true,
      showIf: () => getUserPath().hasCar,
      options: [
        { value: "daily", label: "Daily use" },
        { value: "4-5days", label: "4-5 days per week" },
        { value: "2-3days", label: "2-3 days per week" },
        { value: "1day", label: "1 day per week" },
        { value: "<1week", label: "Less than once per week" },
        { value: "rarely", label: "Sporadically" },
      ],
    },
    {
      id: "car_barriers",
      question: "Barriers to using alternative transport",
      subtitle: "Select up to 3 main factors",
      type: "multiple",
      maxSelections: 3,
      required: true,
      showIf: () => getUserPath().hasCar,
      options: [
        {
          value: "pt_coverage",
          label: "Insufficient public transport coverage",
        },
        { value: "pt_schedule", label: "Inadequate frequency/schedules" },
        {
          value: "pt_slow",
          label: "Excessive travel time on public transport",
        },
        {
          value: "no_bike_lanes",
          label: "Unsafe or nonexistent cycling infrastructure",
        },
        { value: "climate", label: "Weather conditions (high temperatures)" },
        {
          value: "heavy_items",
          label: "Need to transport heavy loads regularly",
        },
        { value: "passengers", label: "Need to transport passengers" },
        { value: "autonomy", label: "Preference for autonomy and flexibility" },
        { value: "habit", label: "Habit / Custom" },
        {
          value: "no_alternatives",
          label: "Lack of knowledge of alternatives",
        },
      ],
    },
    {
      id: "no_car_reason",
      question: "Main reason for not owning a vehicle",
      type: "single",
      required: true,
      showIf: () => !getUserPath().hasCar && getUserPath().hasOtherVehicle,
      options: [
        { value: "cost", label: "Economic factors (Acquisition, maintenance)" },
        {
          value: "no_need",
          label: "Satisfied with other mobility alternatives",
        },
        { value: "parking", label: "Parking difficulty" },
        { value: "environmental", label: "Environmental awareness" },
        { value: "no_license", label: "Lack of driving license" },
        { value: "independence", label: "Personal preference for other means" },
      ],
    },
    {
      id: "satisfaction_vehicle",
      question: "Level of satisfaction with your current mobility",
      subtitle: "1 = Very dissatisfied | 5 = Very satisfied",
      type: "scale",
      required: true,
      showIf: () => !getUserPath().hasCar && getUserPath().hasOtherVehicle,
      scale: { min: 1, max: 5 },
    },
    {
      id: "no_vehicle_reason",
      question: "Main reason for absence of private vehicle",
      type: "single",
      required: true,
      showIf: () => getUserPath().hasNoVehicle,
      options: [
        { value: "cost", label: "Economic factors" },
        { value: "pt_works", label: "Public transport meets my needs" },
        { value: "environmental", label: "Environmental awareness" },
        { value: "no_license", label: "Lack of driving license" },
        {
          value: "no_responsibility",
          label: "Preference to avoid ownership responsibilities",
        },
        { value: "proximity", label: "Proximity to essential services" },
      ],
    },
    {
      id: "decision_factors",
      question: "Determining factors in modal choice",
      subtitle:
        "Order by importance from 1 (Most important) to 5 (Least important)",
      type: "ranking",
      required: true,
      options: [
        { value: "speed", label: "Time efficiency (Speed)" },
        { value: "cost", label: "Economic cost" },
        { value: "comfort", label: "Comfort" },
        { value: "flexibility", label: "Time and spatial flexibility" },
        { value: "sustainability", label: "Environmental sustainability" },
      ],
    },
    {
      id: "motosharing_intention",
      question: "Intention to use shared mobility services",
      subtitle:
        "Given the hypothetical implementation of a shared electric mobility service in Almería",
      type: "single",
      icon: Bike,
      required: true,
      highlight: true,
      options: [
        { value: "very_likely", label: "Very likely (Frequent use)" },
        { value: "likely", label: "Likely (Regular use)" },
        { value: "possible", label: "Possible (Sporadic use/Trial)" },
        { value: "unlikely", label: "Unlikely" },
        { value: "very_unlikely", label: "Not likely at all" },
      ],
    },
    {
      id: "motosharing_features",
      question: "Valued service attributes",
      subtitle: "Select the 3 most critical aspects for you",
      type: "multiple",
      maxSelections: 3,
      required: true,
      showIf: () =>
        ["very_likely", "likely", "possible"].includes(
          answers.motosharing_intention
        ),
      options: [
        { value: "price", label: "Competitive pricing structure" },
        {
          value: "availability",
          label: "Geographic availability (Fleet density)",
        },
        { value: "ease", label: "Digital platform usability (App)" },
        {
          value: "no_license",
          label: "Accessibility without specific license",
        },
        { value: "autonomy", label: "Vehicle autonomy" },
        { value: "charging", label: "Charging/parking infrastructure" },
        { value: "safety", label: "Perceived vehicle safety" },
        { value: "helmets", label: "Provision of safety equipment" },
        { value: "service", label: "User support" },
        { value: "sustainability", label: "Renewable energy guarantee" },
      ],
    },
    {
      id: "willingness_to_pay",
      question: "Willingness to pay",
      subtitle: "Maximum estimated price for a standard 20-minute trip",
      type: "single",
      required: true,
      options: [
        { value: "<2", label: "Less than €2.00" },
        { value: "2-3", label: "Between €2.00 and €3.00" },
        { value: "3-4", label: "Between €3.00 and €4.00" },
        { value: "4-5", label: "Between €4.00 and €5.00" },
        { value: ">5", label: "More than €5.00" },
        {
          value: "none",
          label: "I would not use the service if it had a cost",
        },
      ],
    },
    {
      id: "travel_experience",
      question: "Evaluation of current travel experience",
      type: "single",
      required: true,
      options: [
        { value: "pleasant", label: "Positive / Relaxing" },
        { value: "neutral", label: "Neutral / Routine" },
        { value: "stressful", label: "Stressful (Traffic/Congestion)" },
        {
          value: "uncomfortable",
          label: "Uncomfortable (Weather/Infrastructure)",
        },
        { value: "boring", label: "Negative (Wasted time)" },
        { value: "varies", label: "Varies depending on circumstances" },
      ],
    },
    {
      id: "almeria_problems",
      question: "Diagnosis of mobility in Almería",
      subtitle:
        "Identify the 2 most critical problems according to your criteria",
      type: "multiple",
      maxSelections: 2,
      minSelections: 2,
      required: true,
      options: [
        { value: "traffic", label: "Traffic congestion" },
        { value: "pt_inefficient", label: "Public transport inefficiency" },
        { value: "bike_infra", label: "Lack of cycling infrastructure" },
        { value: "parking", label: "Lack of parking spaces" },
        {
          value: "car_dependency",
          label: "Excessive dependence on private vehicles",
        },
        { value: "pollution", label: "Noise and atmospheric pollution" },
        { value: "connections", label: "Inter-municipal disconnection" },
        {
          value: "no_innovation",
          label: "Absence of innovative mobility models",
        },
        { value: "climate", label: "Adverse weather conditions" },
      ],
    },
    {
      id: "raffle_participation",
      question: "Incentive Draw",
      subtitle:
        "If you wish to participate in the draw for a gift card, please provide your contact details.",
      type: "raffle",
      required: false,
    },
    {
      id: "final",
      type: "final",
      title: "Thank you for your collaboration",
      content: `Your answers have been successfully recorded.\n\nThe information provided is of vital importance for the development of this research on urban mobility in Almería. The results will contribute to proposing well-founded solutions for improving the quality of life of residents.\n\nLead Researcher: Soufyan Essoubai Chikh\nGlobal Business & Economics, FH Aachen University`,
    },
  ];

  const visibleQuestions = questions.filter((q) => !q.showIf || q.showIf());

  const currentQuestion = visibleQuestions[currentStep];
  const progress = ((currentStep + 1) / visibleQuestions.length) * 100;

  const handleAnswer = (value) => {
    setAnswers({ ...answers, [currentQuestion.id]: value });
  };

  // NUEVA FUNCIÓN CORREGIDA PARA EL SORTEO
  const handleRaffleInput = (field, value) => {
    setAnswers((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleMultipleAnswer = (optionValue, maxSelections) => {
    const currentSelected = answers[currentQuestion.id] || [];
    let newSelected;

    if (currentSelected.includes(optionValue)) {
      newSelected = currentSelected.filter((v) => v !== optionValue);
    } else {
      if (maxSelections && currentSelected.length >= maxSelections) {
        return; // Do not allow more selections
      }
      newSelected = [...currentSelected, optionValue];
    }
    handleAnswer(newSelected);
  };

  const handleRankingAnswer = (optionValue) => {
    const currentSelected = answers[currentQuestion.id] || [];
    if (currentSelected.includes(optionValue)) {
      handleAnswer(currentSelected.filter((v) => v !== optionValue));
    } else {
      handleAnswer([...currentSelected, optionValue]);
    }
  };

  const handleSubmitSurvey = async () => {
    if (!user) {
      setSubmitError("Session error. Please reload the page.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await addDoc(collection(db, COLLECTION_NAME), {
        userId: user.uid,
        answers: answers,
        submittedAt: serverTimestamp(),
        deviceInfo: {
          userAgent: navigator.userAgent,
          language: navigator.language,
        },
      });

      setIsSubmitting(false);
      setShowResults(true);
    } catch (error) {
      console.error("Error saving responses:", error);
      setSubmitError(
        "An error occurred while processing your data. Please try again."
      );
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentStep < visibleQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmitSurvey();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    const answer = answers[currentQuestion?.id];
    if (!currentQuestion?.required) return true;

    if (currentQuestion.type === "multiple") {
      if (currentQuestion.minSelections) {
        return answer?.length >= currentQuestion.minSelections;
      }
      return answer && answer.length > 0;
    }

    if (currentQuestion.type === "ranking") {
      return answer && answer.length === currentQuestion.options.length;
    }

    return answer !== undefined && answer !== null && answer !== "";
  };

  const Icon = currentQuestion?.icon;
  const PopupIcon = motivationalMessages[currentPopup]?.icon;

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Survey Completed
          </h2>
          <p className="text-gray-600 mb-6">
            Your answers have been correctly recorded in the database.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-700">
              You can share this questionnaire with other Almería residents to
              increase the study's representativeness.
            </p>
          </div>
          <button
            onClick={() => {
              setCurrentStep(0);
              setAnswers({});
              setShowResults(false);
              setSubmitError(null);
            }}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Start New Survey
          </button>
        </div>
      </div>
    );
  }

  if (currentQuestion?.type === "intro") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            {currentQuestion.title}
          </h1>
          <div className="text-gray-600 whitespace-pre-line mb-6 text-justify leading-relaxed">
            {currentQuestion.content}
          </div>
          <button
            onClick={handleNext}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 flex items-center justify-center transition-colors font-medium"
          >
            Start Survey
            <ChevronRight className="ml-2" />
          </button>
        </div>
      </div>
    );
  }

  if (currentQuestion?.type === "final") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">
            {currentQuestion.title}
          </h1>
          <div className="text-gray-600 whitespace-pre-line mb-6 text-justify">
            {currentQuestion.content}
          </div>

          {submitError && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 flex items-center text-sm">
              <AlertTriangle className="w-5 h-5 mr-2" />
              {submitError}
            </div>
          )}

          <button
            onClick={handleSubmitSurvey}
            disabled={isSubmitting}
            className={`w-full py-3 rounded-lg flex items-center justify-center transition-colors font-medium ${
              isSubmitting
                ? "bg-gray-400 cursor-wait"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin mr-2" /> Processing data...
              </>
            ) : (
              "Submit Answers"
            )}
          </button>
        </div>
      </div>
    );
  }

  if (currentQuestion?.type === "raffle") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <Gift className="w-16 h-16 text-purple-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {currentQuestion.question}
            </h1>
            <p className="text-gray-600">{currentQuestion.subtitle}</p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6 text-sm">
            <h3 className="font-semibold text-purple-900 mb-2">
              Participation Rules:
            </h3>
            <ul className="text-gray-700 space-y-1 list-disc list-inside">
              <li>
                <strong>Incentive:</strong> Gift card worth €50.
              </li>
              <li>
                <strong>Resolution:</strong> Winner will be contacted one week
                after the study closes (study close: 31/12/2025 at 23:59).
              </li>
              <li>
                <strong>Methodology:</strong> Random selection via AI among
                participants.
              </li>
              <li>
                <strong>Deadline:</strong> The beneficiary will have 14 calendar
                days for acceptance.
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                placeholder="example@email.com"
                value={answers.raffle_email || ""}
                onChange={(e) =>
                  handleRaffleInput("raffle_email", e.target.value)
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                placeholder="Full Name"
                value={answers.raffle_name || ""}
                onChange={(e) =>
                  handleRaffleInput("raffle_name", e.target.value)
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Phone (Optional)
              </label>
              <input
                type="tel"
                placeholder="+34 600 000 000"
                value={answers.raffle_phone || ""}
                onChange={(e) =>
                  handleRaffleInput("raffle_phone", e.target.value)
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-sm"
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={answers.raffle_terms || false}
                  onChange={(e) =>
                    handleRaffleInput("raffle_terms", e.target.checked)
                  }
                  className="mt-1 w-4 h-4 text-purple-600"
                />
                <span className="text-xs text-gray-600 text-justify">
                  <strong className="text-purple-700">* </strong>I agree to
                  participate in the draw and authorize the use of my contact
                  details exclusively for prize communication, in accordance
                  with European data protection regulations.
                </span>
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-4 border-t border-gray-100">
            {/* Previous Button - Always Visible */}
            <button
              onClick={handlePrev}
              className="flex-1 py-3 px-4 rounded-lg flex items-center justify-center transition-colors text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              <ChevronLeft className="mr-2 w-4 h-4" />
              Previous
            </button>

            {/* Skip Button - Always Visible */}
            <button
              onClick={handleNext}
              className="flex-1 py-3 px-4 rounded-lg flex items-center justify-center transition-colors text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              Skip
              <ChevronRight className="ml-2 w-4 h-4" />
            </button>

            {/* Participate Button - Disabled if invalid */}
            <button
              onClick={handleNext}
              disabled={
                !answers.raffle_email ||
                !answers.raffle_name ||
                !answers.raffle_terms
              }
              className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center transition-colors text-sm font-medium text-white shadow-md ${
                !answers.raffle_email ||
                !answers.raffle_name ||
                !answers.raffle_terms
                  ? "bg-purple-300 cursor-not-allowed opacity-70"
                  : "bg-purple-600 hover:bg-purple-700 hover:shadow-lg"
              }`}
            >
              Confirm & Participate
              <CheckCircle className="ml-2 w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 relative overflow-hidden font-sans">
      {showPopup && (
        <div
          className="fixed z-50 animate-fade-in-down cursor-pointer left-1/2 -translate-x-1/2 w-full max-w-xs px-4"
          onClick={() => setShowPopup(false)}
          style={{
            top: "20px",
          }}
        >
          <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-sm border border-white/50 p-3 transform transition-all hover:bg-white/70">
            <div className="flex items-start space-x-3">
              <div className="bg-indigo-600/10 p-2 rounded-full flex-shrink-0">
                {PopupIcon && <PopupIcon className="w-4 h-4 text-indigo-700" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 text-xs mb-0.5 truncate uppercase tracking-wide">
                  {motivationalMessages[currentPopup]?.message}
                </h3>
                <p className="text-xs text-gray-600 leading-snug">
                  {motivationalMessages[currentPopup]?.subtitle}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPopup(false);
                }}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in-down {
          0% { opacity: 0; transform: translate(-50%, -10px); }
          100% { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.5s ease-out forwards;
        }
      `}</style>

      <div className="max-w-3xl mx-auto pt-8">
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">
            <span>
              Section {currentStep + 1} / {visibleQuestions.length}
            </span>
            <span>{Math.round(progress)}% Completed</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div
          className={`bg-white rounded-2xl shadow-xl p-8 border border-gray-100 ${
            currentQuestion?.highlight
              ? "ring-4 ring-indigo-50 border-indigo-100"
              : ""
          }`}
        >
          {Icon && (
            <div className="flex justify-center mb-6">
              <div className="bg-indigo-50 p-3 rounded-full">
                <Icon className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          )}

          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 text-center">
            {currentQuestion?.question}
          </h2>
          {currentQuestion?.subtitle && (
            <p className="text-sm text-gray-500 mb-8 text-center">
              {currentQuestion.subtitle}
            </p>
          )}

          {currentQuestion?.type === "single" && (
            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <label
                  key={option.value}
                  onClick={() => handleAnswer(option.value)}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                    answers[currentQuestion.id] === option.value
                      ? "border-indigo-600 bg-indigo-50/50"
                      : "border-gray-200 hover:border-indigo-300 bg-white"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center mr-3 transition-colors ${
                      answers[currentQuestion.id] === option.value
                        ? "border-indigo-600"
                        : "border-gray-300"
                    }`}
                  >
                    {answers[currentQuestion.id] === option.value && (
                      <div className="w-2 h-2 rounded-full bg-indigo-600" />
                    )}
                  </div>
                  <span className="text-gray-700 text-sm font-medium">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          )}

          {currentQuestion?.type === "multiple" && (
            <div className="space-y-3">
              {currentQuestion.options.map((option) => {
                const selected = answers[currentQuestion.id] || [];
                const isSelected = selected.includes(option.value);
                return (
                  <label
                    key={option.value}
                    onClick={() =>
                      handleMultipleAnswer(
                        option.value,
                        currentQuestion.maxSelections
                      )
                    }
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/50"
                        : "border-gray-200 hover:border-indigo-300 bg-white"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center mr-3 transition-colors ${
                        isSelected
                          ? "bg-indigo-600 border-indigo-600"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {isSelected && (
                        <CheckCircle className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className="text-gray-700 text-sm font-medium">
                      {option.label}
                    </span>
                  </label>
                );
              })}
              {currentQuestion.maxSelections && (
                <p className="text-xs text-right text-gray-400 mt-2 italic">
                  Selected: {(answers[currentQuestion.id] || []).length} /{" "}
                  {currentQuestion.maxSelections}
                </p>
              )}
            </div>
          )}

          {currentQuestion?.type === "scale" && (
            <div className="py-8">
              <div className="flex justify-between items-center px-2 mb-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
                <span>Very Dissatisfied</span>
                <span>Very Satisfied</span>
              </div>
              <div className="flex justify-between gap-3">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleAnswer(num)}
                    className={`flex-1 aspect-square rounded-lg text-lg font-bold transition-all ${
                      answers[currentQuestion.id] === num
                        ? "bg-indigo-600 text-white shadow-md transform -translate-y-1"
                        : "bg-gray-50 text-gray-600 hover:bg-indigo-50 border border-gray-100"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentQuestion?.type === "ranking" && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 mb-6 min-h-[40px]">
                {(answers[currentQuestion.id] || []).map((val, idx) => {
                  const opt = currentQuestion.options.find(
                    (o) => o.value === val
                  );
                  return (
                    <span
                      key={val}
                      className="animate-fade-in-down bg-indigo-50 text-indigo-800 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center border border-indigo-100"
                    >
                      <span className="bg-indigo-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] mr-2">
                        {idx + 1}
                      </span>
                      {opt?.label}
                      <button
                        onClick={() => handleRankingAnswer(val)}
                        className="ml-2 text-indigo-400 hover:text-indigo-600 text-sm font-bold"
                      >
                        &times;
                      </button>
                    </span>
                  );
                })}
                {(answers[currentQuestion.id] || []).length === 0 && (
                  <span className="text-sm text-gray-400 italic">
                    Select options below in order of priority...
                  </span>
                )}
              </div>

              <div className="h-px bg-gray-100 my-4" />

              {currentQuestion.options.map((option) => {
                const isSelected = (answers[currentQuestion.id] || []).includes(
                  option.value
                );
                return (
                  <button
                    key={option.value}
                    onClick={() => handleRankingAnswer(option.value)}
                    disabled={isSelected}
                    className={`w-full text-left p-4 border rounded-lg transition-all flex justify-between items-center ${
                      isSelected
                        ? "border-gray-100 bg-gray-50/50 text-gray-400 cursor-not-allowed"
                        : "border-gray-200 hover:border-indigo-300 bg-white hover:shadow-sm"
                    }`}
                  >
                    <span className="text-sm font-medium">{option.label}</span>
                    {!isSelected && (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-200" />
                    )}
                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex gap-4 mt-10 pt-6 border-t border-gray-100">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center transition-colors text-sm font-medium ${
                currentStep === 0
                  ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <ChevronLeft className="mr-2 w-4 h-4" />
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center font-semibold transition-all shadow-sm text-sm ${
                !canProceed()
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md"
              }`}
            >
              {currentStep === visibleQuestions.length - 1 ? "Finish" : "Next"}
              {currentStep !== visibleQuestions.length - 1 && (
                <ChevronRight className="ml-2 w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
