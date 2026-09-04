// src/components/subscription/SubscriptionPage.jsx
import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import "./SubscriptionPage.css";

const API_BASE = process.env.REACT_APP_API_BASE_URL;

const SubscriptionPage = () => {
  const [userInfo, setUserInfo]           = useState(null);
  const [subStatus, setSubStatus]         = useState(null);  // ← NEW
  const [subLoading, setSubLoading]       = useState(true);  // ← NEW
  const [billingCycle, setBillingCycle]   = useState("monthly");
  const [agreedPlans, setAgreedPlans]     = useState({});
  const [subscribingPlan, setSubscribingPlan] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  // ─── Fetch current user ───────────────────────────────────────────
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { "X-User-API-Key": localStorage.getItem("userApiKey") },
        });
        if (res.ok) setUserInfo(await res.json());
      } catch (err) {
        console.error("User info fetch failed:", err);
      }
    };
    fetchUser();
  }, []);

  // ─── NEW: Fetch subscription status on page load ──────────────────
  useEffect(() => {
    const fetchSubStatus = async () => {
      const apiKey = localStorage.getItem("userApiKey");
      if (!apiKey) {
        setSubLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/subscriptions/status`, {
          headers: { "X-User-API-Key": apiKey },
        });
        if (res.ok) {
          const data = await res.json();
          setSubStatus(data);

          // Show the right message based on status
          switch (data.status) {
            case "active":
              // Only show toast if they just came back from payment
              // Otherwise it's noisy on every page load
              break;

            case "pending":
              toast.warn(
                "You have a pending payment. Complete it or subscribe again to start fresh.",
                { autoClose: 8000 }
              );
              break;

            case "cancelled":
              toast.info(
                "Your subscription was cancelled. Resubscribe below to regain access.",
                { autoClose: 8000 }
              );
              break;

            case "failed":
              toast.error(
                "Your last payment failed. Please try subscribing again.",
                { autoClose: 8000 }
              );
              break;

            case "none":
            default:
              // No subscription — show plans silently, no toast needed
              break;
          }
        }
      } catch (err) {
        console.error("Subscription status fetch failed:", err);
      } finally {
        setSubLoading(false);
      }
    };
    fetchSubStatus();
  }, []);

  // ─── Subscribe handler ────────────────────────────────────────────
  const handleSubscribe = async (productCode, tierName, interval) => {
    const apiKey = localStorage.getItem("userApiKey");
    const planKey = `${tierName}-${interval}`;
    setSubscribingPlan(planKey);

    try {
      const plansRes = await fetch(`${API_BASE}/subscriptions/plans`, {
        headers: { "X-User-API-Key": apiKey },
      });
      if (!plansRes.ok) throw new Error("Failed to fetch plans");
      const plans = await plansRes.json();

      const matched = plans.find(
        (p) => p.product_code === productCode && p.interval === interval
      );
      if (!matched) {
        toast.error("Plan not found. Please contact support.");
        return;
      }

      const checkoutRes = await fetch(`${API_BASE}/subscriptions/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-API-Key": apiKey,
        },
        body: JSON.stringify({ plan_id: matched.id }),
      });
      const checkoutData = await checkoutRes.json();

      // ── Handle specific error cases ──────────────────────────────
      if (!checkoutRes.ok) {
        if (checkoutRes.status === 409) {
          toast.error(
            "You already have an active subscription. Cancel it first or use Change Plan.",
            { autoClose: 8000 }
          );
        } else if (checkoutRes.status === 502) {
          toast.error(
            "Payment service temporarily unavailable. Please try again in a moment.",
            { autoClose: 8000 }
          );
        } else {
          throw new Error(checkoutData.detail || "Checkout failed");
        }
        return;
      }

      if (checkoutData.checkout_url) {
        toast.info("Redirecting to payment...", { autoClose: 2000 });
        window.location.href = checkoutData.checkout_url;
      } else {
        toast.error("Could not start payment. Please try again.");
      }
    } catch (err) {
      console.error("Subscription error:", err);
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubscribingPlan(null);
    }
  };

  // ─── Feature definitions ──────────────────────────────────────────
  const featureCategories = [
    {
      category: "Data",
      features: [
        {
          label: "Access to Dashboard",
          detail: "Configure your service, visualise multiple weather sources, and get inspired to include weather in your application.",
        },
        {
          label: "Advanced Analytics",
          detail: "Best-in-class Go/No-Go analytics, drone database access, and custom aircraft insertion.",
        },
      ],
    },
    {
      category: "Usage",
      features: [
        { label: "API Calls", detail: "Maximum API calls per billing cycle." },
        { label: "Credit Sharing", detail: "Share credits with other users across your organisation." },
        { label: "Reselling", detail: "Ability to resell our products and data." },
      ],
    },
    {
      category: "Weather Data",
      features: [
        { label: "Classic Data Quality", detail: "Government weather forecast models and airport METARs." },
        { label: "High Resolution Data", detail: "Top-class underlying weather data feed." },
        { label: "Urban Wind Data", detail: "Hyperlocal CFD-based wind and turbulence data at street level." },
        { label: "Geographical Coverage", detail: "Global Data availability." },
      ],
    },
    {
      category: "Service Level Agreement",
      features: [
        { label: "Basic SLA", detail: "Data comes as-is. No uptime guarantee." },
        { label: "Advanced SLA", detail: "Guaranteed 99% uptime with priority support." },
        { label: "Weather Fit Advisory", detail: "CONOPs-weather optimisation consulting." },
        { label: "Regulatory Support", detail: "Support with regulatory bodies to demonstrate compliance." },
        { label: "Hardware Support", detail: "Assistance with hardware integration." },
      ],
    },
  ];

  // ─── Plan definitions ─────────────────────────────────────────────
  const plans = [
    {
      tier: "Free",
      productCode: billingCycle === "monthly"
        ? "vertimonitor_free_monthly"
        : "vertimonitor_free_yearly",
      monthlyPrice: "€0",
      yearlyPrice: "€0",
      interval: billingCycle,
      features: [
        ["Access to Dashboard", true],
        ["Advanced Analytics", false],
        ["API Calls", "500"],
        ["Credit Sharing", false],
        ["Reselling", false],
        ["Classic Data Quality", true],
        ["High Resolution Data", false],
        ["Urban Wind Data", false],
        ["Geographical Coverage", false],
        ["Basic SLA", true],
        ["Advanced SLA", false],
        ["Weather Fit Advisory", false],
        ["Regulatory Support", false],
        ["Hardware Support", false],
      ],
    },
    {
      tier: "Spot-On",
      productCode: billingCycle === "monthly"
        ? "vertimonitor_spoton_monthly"
        : "vertimonitor_spoton_yearly",
      monthlyPrice: "€95",
      yearlyPrice: "€1,140",
      interval: billingCycle,
      features: [
        ["Access to Dashboard", true],
        ["Advanced Analytics", true],
        ["API Calls", billingCycle === "monthly" ? "10,000" : "120,000"],
        ["Credit Sharing", true],
        ["Reselling", false],
        ["Classic Data Quality", true],
        ["High Resolution Data", false],
        ["Urban Wind Data", false],
        ["Geographical Coverage", true],
        ["Basic SLA", true],
        ["Advanced SLA", false],
        ["Weather Fit Advisory", false],
        ["Regulatory Support", false],
        ["Hardware Support", false],
      ],
    },
    {
      tier: "Startup",
      productCode: billingCycle === "monthly"
        ? "vertimonitor_startup_monthly"
        : "vertimonitor_startup_yearly",
      monthlyPrice: "€175",
      yearlyPrice: "€2,100",
      interval: billingCycle,
      features: [
        ["Access to Dashboard", true],
        ["Advanced Analytics", true],
        ["API Calls", billingCycle === "monthly" ? "5,000" : "60,000"],
        ["Credit Sharing", false],
        ["Reselling", false],
        ["Classic Data Quality", true],
        ["High Resolution Data", false],
        ["Urban Wind Data", false],
        ["Geographical Coverage", false],
        ["Basic SLA", true],
        ["Advanced SLA", false],
        ["Weather Fit Advisory", false],
        ["Regulatory Support", false],
        ["Hardware Support", false],
      ],
    },
    {
      tier: "Corporate",
      productCode: "corporate",
      monthlyPrice: "Contact us",
      yearlyPrice: "Contact us",
      interval: "custom",
      features: [
        ["Access to Dashboard", true],
        ["Advanced Analytics", true],
        ["API Calls", "Customisable"],
        ["Credit Sharing", true],
        ["Reselling", "Customisable"],
        ["Classic Data Quality", true],
        ["High Resolution Data", "Customisable"],
        ["Urban Wind Data", "Customisable"],
        ["Geographical Coverage", true],
        ["Basic SLA", true],
        ["Advanced SLA", true],
        ["Weather Fit Advisory", true],
        ["Regulatory Support", true],
        ["Hardware Support", true],
      ],
    },
  ];

  // ─── Helper: derive button state from subStatus ───────────────────
  const getButtonState = (plan) => {
    const isFree      = plan.tier.toLowerCase() === "free";
    const isCorporate = plan.tier.toLowerCase() === "corporate";

    if (isCorporate) return "contact";

    // If still loading status — disable all buttons
    if (subLoading) return "loading";
    if (subStatus?.is_custom) return "custom";

    // User has active subscription
    if (subStatus?.status === "active") {
      // Is this their current plan?
      if (subStatus.product_code === plan.productCode) return "current";
      // Different plan — offer change
      return isFree ? "downgrade" : "upgrade";
    }

    if (isFree) return "free";
    return "subscribe";
  };

  return (
    <div className="subscription-page">
      <button onClick={() => navigate(-1)} className="go-back-button">
        ← Go Back
      </button>

      <h1>Choose the Right Plan for Your Needs</h1>

      {/* ── Active subscription banner ──────────────────────────── */}
      {subStatus?.status === "active" && (
        <div className="active-sub-banner">
          <span>
            ✅ Active plan: <strong>{subStatus.plan_name}</strong>
            {" · "}{subStatus.api_limit?.toLocaleString()} API calls
            {subStatus.is_custom && (
              <>{" · "}<span style={{ color: "#856404" }}>Custom Plan</span></>
            )}
            {!subStatus.is_custom && subStatus.current_period_end && (
              <>{" · "}Renews {new Date(subStatus.current_period_end).toLocaleDateString()}</>
            )}
          </span>

          {/* Only show cancel button for non-custom plans */}
          {!subStatus.is_custom && (
            <button
              className="cancel-sub-btn"
              onClick={async () => {
                if (!window.confirm("Are you sure you want to cancel your subscription?")) return;
                try {
                  const res = await fetch(`${API_BASE}/subscriptions/cancel`, {
                    method: "POST",
                    headers: { "X-User-API-Key": localStorage.getItem("userApiKey") },
                  });
                  if (res.ok) {
                    toast.success("Subscription cancelled.");
                    setSubStatus({ ...subStatus, status: "cancelled" });
                  } else {
                    const data = await res.json();
                    toast.error(data.detail || "Cancellation failed.");
                  }
                } catch {
                  toast.error("Something went wrong. Please try again.");
                }
              }}
            >
              Cancel subscription
            </button>
          )}

          {/* Custom plan — show contact message instead */}
          {subStatus.is_custom && (
            <span style={{ fontSize: "0.8rem", color: "#856404" }}>
              To modify your plan contact{" "}
              <a href="mailto:support@dm-airtech.com">support@dm-airtech.com</a>
            </span>
          )}
        </div>
      )}

      {/* Billing toggle */}
      <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginBottom: "2rem" }}>
        <button
          onClick={() => setBillingCycle("monthly")}
          className={billingCycle === "monthly" ? "billing-toggle active" : "billing-toggle"}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle("yearly")}
          className={billingCycle === "yearly" ? "billing-toggle active" : "billing-toggle"}
        >
          Yearly
        </button>
      </div>

      {/* VertiMonitor product section */}
      <div className="product-section">
        <h2>VertiMonitor</h2>
        <p className="product-description">
          Real-time monitoring of airspace and drone routes. Stay compliant and aware.
        </p>

        <div className="table-wrapper">
          <div className="comparison-grid">

            {/* Header row */}
            <div className="grid-row header-row">
              <div className="grid-cell feature-col"><strong>Features</strong></div>
              {plans.map((plan, idx) => (
                <div key={idx} className="grid-cell plan-header-col">
                  <h3>{plan.tier}</h3>
                  <p>
                    {billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice}
                    {plan.interval !== "custom" && (
                      <span style={{ fontSize: "0.75rem", color: "#888" }}>
                        {" "}/ {billingCycle}
                      </span>
                    )}
                  </p>
                </div>
              ))}
            </div>

            {/* Feature rows */}
            {featureCategories.map((cat, catIdx) => (
              <React.Fragment key={catIdx}>
                <div className="grid-row category-row">
                  <div className="grid-cell feature-col category-header">
                    <h4>{cat.category}</h4>
                  </div>
                  {plans.map((_, idx) => (
                    <div key={idx} className="grid-cell plan-feature-col category-spacer" />
                  ))}
                </div>

                {cat.features.map((feature, featIdx) => (
                  <div key={featIdx} className="grid-row">
                    <div className="grid-cell feature-col">
                      <details>
                        <summary>{feature.label}</summary>
                        <p className="feature-detail">{feature.detail}</p>
                      </details>
                    </div>
                    {plans.map((plan, idx) => {
                      const found = plan.features.find(([l]) => l === feature.label);
                      const value = found ? found[1] : false;
                      return (
                        <div key={idx} className="grid-cell plan-feature-col">
                          {value === true
                            ? "✅"
                            : value === false
                            ? "❌"
                            : <span className="value-text">{value}</span>}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </React.Fragment>
            ))}

            {/* Subscribe row */}
            <div className="grid-row subscribe-row">
              <div className="grid-cell feature-col" />
              {plans.map((plan, idx) => {
                const planKey     = `${plan.tier}-${billingCycle}`;
                const isLoading   = subscribingPlan === planKey;
                const hasAgreed   = agreedPlans[planKey] || false;
                const isFree      = plan.tier.toLowerCase() === "free";
                const isCorporate = plan.tier.toLowerCase() === "corporate";
                const btnState    = getButtonState(plan);

                return (
                  <div key={idx} className="grid-cell plan-feature-col">
                    <div>

                    {/* Terms checkbox for paid plans */}
                    {!isCorporate && !isFree && btnState === "subscribe" && (
                      <label style={{ fontSize: "0.8rem", display: "block", marginBottom: "0.5rem" }}>
                        <input
                          type="checkbox"
                          checked={hasAgreed}
                          onChange={(e) =>
                            setAgreedPlans((prev) => ({
                              ...prev,
                              [planKey]: e.target.checked,
                            }))
                          }
                        />{" "}
                        I agree to the{" "}
                        <a
                          href="https://www.dm-airtech.com/privacy-policy/"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Terms & Conditions
                        </a>
                      </label>
                    )}

                    {/* ── Button rendering by state ───────────────── */}
                    {btnState === "contact" && (
                      <button className="subscribe-btn" onClick={() => navigate("/contact")}>
                        Contact Us
                      </button>
                    )}

                    {btnState === "loading" && (
                      <button className="subscribe-btn" disabled>
                        Loading...
                      </button>
                    )}

                    {btnState === "current" && (
                      <button className="subscribe-btn current-plan" disabled>
                        ✅ Current Plan
                      </button>
                    )}

                    {btnState === "free" && (
                      <button
                        className="subscribe-btn current-plan"
                        onClick={() => toast.info("You are on the Free plan. Upgrade anytime.")}
                      >
                        Free Plan
                      </button>
                    )}

                    {btnState === "subscribe" && (
                      <button
                        className="subscribe-btn"
                        disabled={!hasAgreed || isLoading}
                        style={!hasAgreed ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                        onClick={() =>
                          handleSubscribe(plan.productCode, plan.tier, plan.interval)
                        }
                      >
                        {isLoading ? "Processing..." : "Subscribe"}
                      </button>
                    )}

                    {btnState === "upgrade" && (
                      <button
                        className="subscribe-btn"
                        onClick={() => {
                          if (window.confirm(`Switch to ${plan.tier} plan?`)) {
                            handleSubscribe(plan.productCode, plan.tier, plan.interval);
                          }
                        }}
                      >
                        Upgrade
                      </button>
                    )}
                    {btnState === "custom" && (
                      <button
                        className="subscribe-btn current-plan"
                        disabled
                        onClick={() => toast.info("You are on a custom plan. Contact support to change.")}
                      >
                        Custom Plan
                      </button>
                    )}
                    {btnState === "downgrade" && (
                      <button
                        className="subscribe-btn downgrade-btn"
                        onClick={() => {
                          if (window.confirm(`Downgrade to ${plan.tier} plan?`)) {
                            handleSubscribe(plan.productCode, plan.tier, plan.interval);
                          }
                        }}
                      >
                        Downgrade
                      </button>
                    )}

                  </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
};

export default SubscriptionPage;