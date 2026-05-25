import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTenant } from "../../context/TenantContext";
import { getPlans } from "../../services/subscriptionService";
import { useAuth } from "../../context/AuthContext";

export default function MockPayment() {
  const navigate = useNavigate();
  const { tenantCode } = useTenant();
  const { user: authUser } = useAuth();

  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  // Form states
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardName, setCardName] = useState(authUser?.name || "");
  const [country, setCountry] = useState("Philippines");
  
  // Validation / Loading states
  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [mockUrl, setMockUrl] = useState("");

  useEffect(() => {
    // 1. Get mock checkout URL from session storage
    const storedUrl = sessionStorage.getItem("mockCheckoutUrl") || "";
    setMockUrl(storedUrl);

    // 2. Fetch plans to display custom details
    setIsLoadingPlans(true);
    getPlans()
      .then((data) => {
        setPlans(data);
        if (storedUrl) {
          try {
            const urlObj = new URL(storedUrl);
            const planId = parseInt(urlObj.searchParams.get("planId") || "", 10);
            const matched = data.find((p) => p.planID === planId);
            if (matched) {
              setSelectedPlan(matched);
            }
          } catch (e) {
            console.error("Failed to parse mock checkout plan ID:", e);
          }
        }
        setIsLoadingPlans(false);
      })
      .catch((err) => {
        console.error("Failed to load plans for checkout page:", err);
        setIsLoadingPlans(false);
      });
  }, []);

  // Form input formatting
  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Keep digits only
    if (value.length <= 16) {
      // Add space every 4 digits
      const formatted = value.match(/.{1,4}/g)?.join(" ") || "";
      setCardNumber(formatted);
      if (errors.cardNumber) setErrors(prev => ({ ...prev, cardNumber: "" }));
    }
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, ""); // Keep digits only
    if (value.length <= 4) {
      if (value.length > 2) {
        value = `${value.slice(0, 2)}/${value.slice(2)}`;
      }
      setExpiry(value);
      if (errors.expiry) setErrors(prev => ({ ...prev, expiry: "" }));
    }
  };

  const handleCvcChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 4) {
      setCvc(value);
      if (errors.cvc) setErrors(prev => ({ ...prev, cvc: "" }));
    }
  };

  // Card brand resolver based on first digit
  const getCardBrand = () => {
    const firstDigit = cardNumber.replace(/\s/g, "")[0];
    if (firstDigit === "4") return { name: "Visa", icon: "💳" };
    if (firstDigit === "5") return { name: "Mastercard", icon: "🎴" };
    if (firstDigit === "3") return { name: "Amex", icon: "🎟️" };
    return { name: "Generic", icon: "🔒" };
  };

  const validateForm = () => {
    const newErrors = {};
    const rawCard = cardNumber.replace(/\s/g, "");
    
    if (rawCard.length !== 16) {
      newErrors.cardNumber = "Card number must be 16 digits";
    }
    
    const expiryParts = expiry.split("/");
    if (expiry.length !== 5 || expiryParts.length !== 2) {
      newErrors.expiry = "Expiration date must be MM/YY";
    } else {
      const month = parseInt(expiryParts[0], 10);
      if (month < 1 || month > 12) {
        newErrors.expiry = "Invalid month";
      }
    }
    
    if (cvc.length < 3 || cvc.length > 4) {
      newErrors.cvc = "CVC must be 3 or 4 digits";
    }
    
    if (!cardName.trim()) {
      newErrors.cardName = "Cardholder name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePay = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsProcessing(true);
    // Simulate transaction delay
    setTimeout(() => {
      if (mockUrl) {
        window.location.href = mockUrl;
      } else {
        alert("Mock Checkout URL not found. Redirecting to subscription management.");
        navigate(`/${tenantCode}/admin/subscription`);
      }
    }, 1500);
  };

  const handleCancel = () => {
    navigate(`/${tenantCode}/admin/subscription`);
  };

  const cardBrand = getCardBrand();
  const price = selectedPlan ? selectedPlan.priceMonthly : 499;
  const planName = selectedPlan ? selectedPlan.name : "Premium Plan";

  return (
    <div className="stripe-mock-wrapper">
      {/* Dynamic Embedded CSS block for modern UI aesthetics */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        .stripe-mock-wrapper {
          min-height: 100vh;
          background: #f8fafc;
          font-family: 'Inter', -apple-system, sans-serif;
          display: flex;
          align-items: stretch;
          justify-content: center;
          box-sizing: border-box;
          width: 100%;
        }

        .stripe-mock-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          width: 100%;
          max-width: 1300px;
          background: #ffffff;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
        }

        .stripe-mock-left {
          background: #0f172a;
          color: #f8fafc;
          padding: 64px 80px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border-right: 1px solid #1e293b;
          box-sizing: border-box;
        }

        .stripe-mock-right {
          background: #ffffff;
          padding: 64px 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
        }

        .logo-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 48px;
        }

        .back-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          font-size: 14px;
          cursor: pointer;
          font-weight: 500;
          padding: 0;
          transition: color 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .back-btn:hover {
          color: #f1f5f9;
        }

        .brand-text {
          font-size: 16px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: #38bdf8;
        }

        .summary-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          margin: 40px 0;
        }

        .plan-heading {
          font-size: 16px;
          color: #94a3b8;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .price-display {
          display: flex;
          align-items: baseline;
          margin-bottom: 40px;
        }

        .price-symbol {
          font-size: 28px;
          font-weight: 700;
          color: #f1f5f9;
          margin-right: 4px;
        }

        .price-amount {
          font-size: 56px;
          font-weight: 800;
          color: #ffffff;
          line-height: 1;
        }

        .price-frequency {
          font-size: 16px;
          color: #94a3b8;
          margin-left: 12px;
        }

        .item-details-box {
          background: rgba(30, 41, 59, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 24px;
        }

        .item-line {
          display: flex;
          justify-content: space-between;
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .feature-bullets {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 24px;
        }

        .feature-bullet {
          font-size: 13px;
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .divider-line {
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
          margin: 16px 0;
        }

        .total-line {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .total-title {
          font-size: 14px;
          color: #94a3b8;
          font-weight: 500;
        }

        .total-amount {
          font-size: 20px;
          font-weight: 700;
          color: #ffffff;
        }

        .secure-footer {
          font-size: 12px;
          color: #475569;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .form-container {
          width: 100%;
          maxWidth: 400px;
        }

        .form-title {
          font-size: 22px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 28px;
        }

        .checkout-form {
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .form-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 8px;
        }

        .text-input {
          width: 100%;
          padding: 12px 14px;
          font-size: 15px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #ffffff;
          color: #0f172a;
          outline: none;
          box-sizing: border-box;
          transition: all 0.2s ease;
        }

        .text-input:focus {
          border-color: #635bff;
          box-shadow: 0 0 0 3px rgba(99, 91, 255, 0.12);
        }

        .card-number-wrapper {
          position: relative;
        }

        .card-brand-icon {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 20px;
          pointer-events: none;
        }

        .multi-inputs {
          display: flex;
          width: 100%;
        }

        .expiry-input {
          border-top-left-radius: 0;
          border-top-right-radius: 0;
          border-bottom-right-radius: 0;
          border-right-width: 0;
        }

        .cvc-input {
          border-top-left-radius: 0;
          border-top-right-radius: 0;
          border-bottom-left-radius: 0;
        }

        .select-input {
          width: 100%;
          padding: 12px 14px;
          font-size: 15px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #ffffff;
          color: #0f172a;
          outline: none;
          cursor: pointer;
          box-sizing: border-box;
          appearance: none;
          background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E");
          background-position: right 10px center;
          background-repeat: no-repeat;
          background-size: 20px;
        }

        .select-input:focus {
          border-color: #635bff;
          box-shadow: 0 0 0 3px rgba(99, 91, 255, 0.12);
        }

        .checkbox-row {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          margin-top: 6px;
        }

        .checkbox-control {
          margin-top: 3px;
          cursor: pointer;
          width: 16px;
          height: 16px;
        }

        .checkbox-label {
          font-size: 12px;
          color: #64748b;
          line-height: 1.5;
          cursor: pointer;
          user-select: none;
        }

        .pay-submit-btn {
          background: #635bff;
          color: #ffffff;
          padding: 14px 20px;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(99, 91, 255, 0.15);
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 48px;
          box-sizing: border-box;
        }

        .pay-submit-btn:hover {
          background: #4f46e5;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(99, 91, 255, 0.25);
        }

        .pay-submit-btn:active {
          transform: translateY(1px);
        }

        .pay-submit-btn:disabled {
          background: #94a3b8;
          color: #cbd5e1;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .cancel-btn {
          background: transparent;
          color: #64748b;
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.2s ease;
          width: 100%;
          text-align: center;
        }

        .cancel-btn:hover {
          color: #0f172a;
        }

        .error-message {
          font-size: 12px;
          color: #ef4444;
          margin-top: 4px;
          font-weight: 500;
        }

        .stripe-sandbox-warning {
          margin-top: 32px;
          display: flex;
          gap: 8px;
          align-items: flex-start;
          font-size: 11px;
          color: #94a3b8;
          line-height: 1.5;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 900px) {
          .stripe-mock-grid {
            grid-template-columns: 1fr;
          }

          .stripe-mock-left {
            padding: 40px;
            border-right: none;
            border-bottom: 1px solid #1e293b;
          }

          .stripe-mock-right {
            padding: 48px 40px;
          }
        }
      `}</style>

      <div className="stripe-mock-grid">
        {/* Left Panel: Order Summary */}
        <div className="stripe-mock-left">
          <div className="logo-row">
            <button onClick={handleCancel} className="back-btn">
              &larr; Cancel payment
            </button>
            <div className="brand-text">benkyou lms</div>
          </div>

          <div className="summary-content">
            <div className="plan-heading">Subscribe to {planName}</div>
            <div className="price-display">
              <span className="price-symbol">₱</span>
              <span className="price-amount">{price.toFixed(2)}</span>
              <span className="price-frequency">per month</span>
            </div>

            <div className="item-details-box">
              <div className="item-line">
                <span>{planName} subscription</span>
                <span style={{ color: "#38bdf8" }}>₱{price.toFixed(2)}</span>
              </div>
              {selectedPlan && (
                <div className="feature-bullets">
                  {selectedPlan.maxUsers != null && <div className="feature-bullet"><span>✓</span> Up to {selectedPlan.maxUsers} active users</div>}
                  {selectedPlan.maxCourses != null && <div className="feature-bullet"><span>✓</span> Up to {selectedPlan.maxCourses} courses</div>}
                  {selectedPlan.maxStorageGB != null && <div className="feature-bullet"><span>✓</span> {selectedPlan.maxStorageGB} GB secure cloud storage</div>}
                </div>
              )}
              <div className="divider-line" />
              <div className="total-line">
                <span className="total-title">Total due today</span>
                <span className="total-amount">₱{price.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="secure-footer">
            <span>🔒 Secure SSL checkout powered by Stripe Mock Engine</span>
          </div>
        </div>

        {/* Right Panel: Payment Form */}
        <div className="stripe-mock-right">
          <div className="form-container">
            <h2 className="form-title">Pay with card</h2>
            <form onSubmit={handlePay} className="checkout-form">
              
              {/* Cardholder Name */}
              <div>
                <label className="form-label">Cardholder Name</label>
                <input
                  type="text"
                  placeholder="Jane Doe"
                  className="text-input"
                  value={cardName}
                  onChange={(e) => {
                    setCardName(e.target.value);
                    if (errors.cardName) setErrors(prev => ({ ...prev, cardName: "" }));
                  }}
                  style={{ borderColor: errors.cardName ? "#ef4444" : "#cbd5e1" }}
                  disabled={isProcessing}
                />
                {errors.cardName && <div className="error-message">{errors.cardName}</div>}
              </div>

              {/* Card Information */}
              <div>
                <label className="form-label">Card Information</label>
                <div className="card-number-wrapper">
                  <input
                    type="text"
                    placeholder="4242 4242 4242 4242"
                    className="text-input"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    style={{ 
                      paddingRight: "50px",
                      borderColor: errors.cardNumber ? "#ef4444" : "#cbd5e1",
                      borderBottomLeftRadius: 0,
                      borderBottomRightRadius: 0,
                      marginBottom: "-1px"
                    }}
                    disabled={isProcessing}
                  />
                  <span className="card-brand-icon">{cardBrand.icon}</span>
                </div>

                {/* Expiry and CVC block */}
                <div className="multi-inputs">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="text-input expiry-input"
                    value={expiry}
                    onChange={handleExpiryChange}
                    style={{ 
                      width: "50%",
                      borderColor: errors.expiry ? "#ef4444" : "#cbd5e1"
                    }}
                    disabled={isProcessing}
                  />
                  <input
                    type="password"
                    placeholder="CVC"
                    className="text-input cvc-input"
                    value={cvc}
                    onChange={handleCvcChange}
                    style={{ 
                      width: "50%",
                      borderColor: errors.cvc ? "#ef4444" : "#cbd5e1"
                    }}
                    disabled={isProcessing}
                  />
                </div>
                {(errors.cardNumber || errors.expiry || errors.cvc) && (
                  <div className="error-message">
                    {errors.cardNumber || errors.expiry || errors.cvc}
                  </div>
                )}
              </div>

              {/* Country select */}
              <div>
                <label className="form-label">Country or Region</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="select-input"
                  disabled={isProcessing}
                >
                  <option value="Philippines">Philippines</option>
                  <option value="United States">United States</option>
                  <option value="Singapore">Singapore</option>
                  <option value="Japan">Japan</option>
                  <option value="Australia">Australia</option>
                </select>
              </div>

              {/* simulated checkbox */}
              <div className="checkbox-row">
                <input type="checkbox" defaultChecked id="save-info" className="checkbox-control" />
                <label htmlFor="save-info" className="checkbox-label">
                  Securely save my payment information for future 1-click upgrades
                </label>
              </div>

              {/* Action Buttons */}
              <div style={{ marginTop: "10px" }}>
                <button 
                  type="submit" 
                  disabled={isProcessing} 
                  className="pay-submit-btn"
                >
                  {isProcessing ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div className="spinner" />
                      <span>Processing transaction...</span>
                    </div>
                  ) : (
                    `Subscribe - ₱${price.toFixed(2)}`
                  )}
                </button>

                <button 
                  type="button" 
                  onClick={handleCancel} 
                  disabled={isProcessing} 
                  className="cancel-btn"
                >
                  Cancel and return
                </button>
              </div>
            </form>

            <div className="stripe-sandbox-warning">
              <span style={{ fontSize: "14px" }}>🔒</span>
              <span>
                <strong>Sandbox Mode:</strong> This is a secure Stripe mock checkout container. You can type any valid 16-digit card number (e.g. 4242 4242 4242 4242) and any expiry/CVC to complete your upgrade. No live funds are transacted.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
