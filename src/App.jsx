import { useState } from "react";
import { PRODUCTS } from "./data/products.js";
const CATEGORIES = ["All", ...new Set(PRODUCTS.map(p => p.category))];
const TRACKING_STEPS = ["Order Placed","Payment Confirmed","Preparing Your Order","Picked Up by Carrier","In Transit","Out for Delivery","Delivered!"];
const AGE_BRACKETS = ["18-24","25-34","35-44","45-54","55+"];
const CAT_COLORS = {
  Kitchen:"#ff9900", Electronics:"#007185", Sports:"#c45500", Home:"#6c5ce7",
  Garden:"#00b894", Beauty:"#e84393", "Books & Office":"#0984e3", Clothing:"#6d4c41",
  "Pet Supplies":"#fd79a8", "Toys & Games":"#fdcb6e", Automotive:"#636e72",
  Tools:"#b2bec3", Baby:"#a29bfe", "Food & Grocery":"#00cec9", Health:"#55efc4", Travel:"#74b9ff"
};

// ── STORAGE ───────────────────────────────────────────────────────────────────
const USERS_KEY    = "zerocart-users";
const ORDERS_KEY   = "zerocart-orders";
const IMPULSE_KEY  = "zerocart-impulse";
const WISHLIST_KEY = "zerocart-wishlist";
const loadJSON = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } };
const saveJSON = (k, v)  => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// ── HELPERS ───────────────────────────────────────────────────────────────────
const uid      = () => Math.random().toString(36).slice(2, 10);
const newOrder = () => String(Math.floor(100000000 + Math.random() * 900000000));
const fmtDate  = iso => new Date(iso).toLocaleDateString("en-CA", { month:"short", day:"numeric", year:"numeric" });
const fmtMoney = n => `$${Number(n).toFixed(2)}`;
const ageBracket = age => {
  const a = Number(age);
  if (a < 25) return "18-24"; if (a < 35) return "25-34";
  if (a < 45) return "35-44"; if (a < 55) return "45-54"; return "55+";
};

const buildReceiptText = (cart, userName) => {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = subtotal * 0.12;
  const items = cart.map(i => `  ${i.img} ${i.name} — ${fmtMoney(i.price * i.qty)}`).join("\n");
  return `🧾 ZEROCART DOPAMINE RECEIPT\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n${userName ? `Shopper: ${userName}` : "Anonymous shopper"}\nDate: ${new Date().toLocaleDateString("en-CA", { month:"long", day:"numeric", year:"numeric" })}\n\nITEMS "ORDERED":\n${items}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\nSubtotal:       ${fmtMoney(subtotal)}\nTax (GST+PST):  ${fmtMoney(tax)}\nTOTAL FAKE:     ${fmtMoney(subtotal + tax)}\nREAL COST:      $0.00\n━━━━━━━━━━━━━━━━━━━━━━━━━━\nNothing shipped. No boxes coming.\nJust the good feeling — for free.\n\nzerocart. — shop the feeling, keep the cash`;
};

// ── STARS ─────────────────────────────────────────────────────────────────────
function Stars({ rating }) {
  return (
    <span style={{ color:"#e77600", fontSize:12 }}>
      {"★".repeat(Math.floor(rating))}{"☆".repeat(5-Math.floor(rating))}
      <span style={{ color:"#777", marginLeft:4, fontSize:11 }}>{rating}</span>
    </span>
  );
}

function MiniBar({ value, max, color="#1a1f36" }) {
  return (
    <div style={{ background:"#e2e8f0", borderRadius:3, height:8, overflow:"hidden", flex:1 }}>
      <div style={{ background:color, height:"100%", width: max ? `${(value/max)*100}%` : "0%", borderRadius:3, transition:"width 0.4s" }} />
    </div>
  );
}

// ── SAVINGS BANNER ────────────────────────────────────────────────────────────
function SavingsBanner({ userId }) {
  const orders = loadJSON(ORDERS_KEY, []);
  const myOrders = orders.filter(o => o.userId === userId);
  const totalSaved = myOrders.reduce((s, o) => s + o.total, 0);
  const sessionCount = myOrders.length;
  if (sessionCount === 0) return null;
  return (
    <div style={{ background:"linear-gradient(135deg, #232f3e 0%, #1a6633 100%)", borderRadius:10, padding:"14px 18px", marginBottom:14, display:"flex", alignItems:"center", gap:16 }}>
      <div style={{ fontSize:32, flexShrink:0 }}>💰</div>
      <div style={{ flex:1 }}>
        <div style={{ color:"#ffd814", fontWeight:800, fontSize:18 }}>{fmtMoney(totalSaved)} saved</div>
        <div style={{ color:"#aaa", fontSize:12, marginTop:2 }}>across {sessionCount} zerocart session{sessionCount>1?"s":""} — real money still in your pocket</div>
      </div>
      <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:8, padding:"8px 12px", textAlign:"center", flexShrink:0 }}>
        <div style={{ color:"#fff", fontWeight:700, fontSize:14 }}>{sessionCount}</div>
        <div style={{ color:"#aaa", fontSize:10 }}>sessions</div>
      </div>
    </div>
  );
}

// ── PRODUCT CARD ──────────────────────────────────────────────────────────────
function ProductCard({ product, onAdd, onWishlist, wishlisted }) {
  const [flash, setFlash] = useState(false);
  const add = () => { onAdd(product); setFlash(true); setTimeout(() => setFlash(false), 900); };
  const catColor = CAT_COLORS[product.category] || "#888";
  return (
    <div style={{ background:"#fff", borderRadius:10, padding:"12px 12px 14px", boxShadow:"0 1px 4px rgba(0,0,0,0.07)", display:"flex", flexDirection:"column", gap:6, border:"1px solid #e8e8e8", position:"relative" }}>
      {product.tag && (
        <div style={{ position:"absolute", top:9, left:9, background: product.tag==="Best Seller"?"#c45500": product.tag==="#1 Pick"?"#007185":"#e77600", color:"#fff", fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:3 }}>{product.tag}</div>
      )}
      {/* Wishlist heart */}
      <button
        onClick={() => onWishlist(product)}
        style={{ position:"absolute", top:8, right:8, background:"none", border:"none", fontSize:18, cursor:"pointer", lineHeight:1, padding:2, color: wishlisted ? "#e84393" : "#ccc", transition:"color 0.2s" }}
        title={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
      >
        {wishlisted ? "♥" : "♡"}
      </button>
      <div style={{ position:"absolute", top:32, right:9, background:catColor, color:"#fff", fontSize:9, fontWeight:700, padding:"2px 6px", borderRadius:3, opacity:0.85 }}>{product.category}</div>
      <img src={product.img} alt={product.name} style={{ width:"100%", height:140, objectFit:"cover", borderRadius:6, marginTop: product.tag ? 16 : 8 }} />
      <div style={{ fontSize:12, color:"#0f1111", fontWeight:500, lineHeight:1.35 }}>{product.name}</div>
      <Stars rating={product.rating} />
      <div style={{ fontSize:11, color:"#888" }}>{product.reviews.toLocaleString()} reviews</div>
      {product.swift && (
        <div style={{ display:"flex", gap:5, alignItems:"center" }}>
          <span style={{ background:"#ff9900", color:"#fff", fontSize:9, fontWeight:800, padding:"1px 6px", borderRadius:3 }}>⚡ swift</span>
          <span style={{ fontSize:11, color:"#555" }}>FREE · Tomorrow</span>
        </div>
      )}
      <div style={{ fontSize:18, fontWeight:700 }}>{fmtMoney(product.price)}</div>
      <button onClick={add} style={{ background: flash?"#2da44e":"#ffd814", border:"1px solid", borderColor: flash?"#2da44e":"#ffa41c", borderRadius:24, padding:"8px 0", fontSize:12, fontWeight:600, cursor:"pointer", color: flash?"#fff":"#0f1111", transition:"all 0.2s" }}>
        {flash ? "✓ Added!" : "Add to Cart"}
      </button>
    </div>
  );
}

// ── CART SIDEBAR ──────────────────────────────────────────────────────────────
function CartSidebar({ cart, onRemove, onClose, onCheckout }) {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  return (
    <div style={{ position:"fixed", top:0, right:0, width:"min(340px, 100vw)", height:"100dvh", background:"#fff", boxShadow:"-4px 0 20px rgba(0,0,0,0.15)", display:"flex", flexDirection:"column", zIndex:100 }}>
      <div style={{ background:"#232f3e", color:"#fff", padding:"14px 18px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:16, fontWeight:700 }}>Cart ({cart.reduce((s,i)=>s+i.qty,0)})</span>
        <button onClick={onClose} style={{ background:"none", border:"none", color:"#fff", fontSize:24, cursor:"pointer" }}>×</button>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:14, display:"flex", flexDirection:"column", gap:10 }}>
        {cart.length===0 && <div style={{ color:"#bbb", textAlign:"center", marginTop:60, fontSize:14 }}>Your cart is empty</div>}
        {cart.map(item => (
          <div key={item.id} style={{ display:"flex", gap:10, borderBottom:"1px solid #f0f0f0", paddingBottom:10 }}>
            <div style={{ fontSize:30, flexShrink:0 }}>{item.img}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:500, lineHeight:1.3 }}>{item.name}</div>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:5 }}>
                <span style={{ fontWeight:700, fontSize:13 }}>{fmtMoney(item.price * item.qty)}</span>
                <button onClick={() => onRemove(item.id)} style={{ background:"none", border:"none", color:"#c45500", fontSize:11, cursor:"pointer", textDecoration:"underline" }}>Remove</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {cart.length > 0 && (
        <div style={{ padding:14, borderTop:"1px solid #eee" }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontWeight:700, fontSize:16, marginBottom:12 }}>
            <span>Subtotal</span><span>{fmtMoney(total)}</span>
          </div>
          <button onClick={onCheckout} style={{ width:"100%", background:"#ffd814", border:"1px solid #ffa41c", borderRadius:24, padding:"12px 0", fontSize:15, fontWeight:700, cursor:"pointer" }}>
            Proceed to Checkout
          </button>
        </div>
      )}
    </div>
  );
}

// ── IMPULSE CHECK MODAL ───────────────────────────────────────────────────────
function ImpulseCheckModal({ cart, onGood, onSaveWishlist, onKeepShopping }) {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const itemCount = cart.reduce((s, i) => s + i.qty, 0);
  const hero = [...cart].sort((a, b) => b.price - a.price)[0];
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"#fff", borderRadius:18, width:"100%", maxWidth:360, boxShadow:"0 16px 48px rgba(0,0,0,0.3)", overflow:"hidden" }}>
        <div style={{ background:"#232f3e", padding:"20px 22px 16px" }}>
          <div style={{ color:"#ff9900", fontWeight:900, fontSize:16, letterSpacing:-0.5, marginBottom:8 }}>
            zerocart<span style={{ color:"#fff" }}>.</span>
          </div>
          <div style={{ color:"#fff", fontSize:19, fontWeight:800, lineHeight:1.3 }}>
            Wait — do you actually<br />want {itemCount === 1 ? "this" : "these"}?
          </div>
        </div>
        <div style={{ background:"#fafafa", borderBottom:"1px solid #eee", padding:"14px 22px", display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ fontSize:36, flexShrink:0 }}>{hero?.img}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, color:"#0f1111", fontWeight:600, lineHeight:1.35, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {itemCount > 1 ? `${itemCount} items in cart` : hero?.name}
            </div>
            <div style={{ fontSize:13, fontWeight:700, color:"#c45500", marginTop:3 }}>{fmtMoney(total)}</div>
          </div>
        </div>
        <div style={{ padding:"16px 22px 14px" }}>
          <p style={{ margin:0, fontSize:13, color:"#444", lineHeight:1.65 }}>
            The urge is real. But so is the clutter, the cost, and the box you'll trip over in three weeks.
          </p>
          <p style={{ margin:"10px 0 0", fontSize:13, color:"#444", lineHeight:1.65 }}>
            You've already had the feeling. That part's free.
          </p>
        </div>
        <div style={{ padding:"4px 22px 22px", display:"flex", flexDirection:"column", gap:10 }}>
          <button onClick={onGood} style={{ background:"#ffd814", border:"1px solid #ffa41c", borderRadius:24, padding:"13px 0", fontSize:15, fontWeight:800, cursor:"pointer", color:"#0f1111" }}>
            😌 I'm good — keep the cash
          </button>
          <button onClick={onSaveWishlist} style={{ background:"#fff0f7", border:"1px solid #f5a0cc", borderRadius:24, padding:"12px 0", fontSize:14, fontWeight:600, cursor:"pointer", color:"#c0397a" }}>
            ♥ Save to My Wishlist instead
          </button>
          <button onClick={onKeepShopping} style={{ background:"none", border:"none", fontSize:12, color:"#aaa", cursor:"pointer", textDecoration:"underline", padding:"4px 0" }}>
            keep shopping
          </button>
        </div>
        <div style={{ textAlign:"center", paddingBottom:16, fontSize:11, color:"#bbb" }}>
          Most zerocart shoppers choose "I'm good" 💛
        </div>
      </div>
    </div>
  );
}

// ── CHECKOUT ──────────────────────────────────────────────────────────────────
function CheckoutPage({ cart, user, onPlace }) {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = total * 0.12;
  return (
    <div style={{ maxWidth:700, margin:"0 auto", padding:"20px 14px" }}>
      <h2 style={{ fontSize:20, fontWeight:700, marginBottom:18 }}>Checkout</h2>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(260px, 1fr))", gap:14 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ background:"#fff", border:"1px solid #ddd", borderRadius:10, padding:16 }}>
            <div style={{ fontWeight:700, marginBottom:10, fontSize:14 }}>Shipping address</div>
            {user && <div style={{ fontSize:13, color:"#007600", marginBottom:8 }}>👋 Welcome back, {user.name}!</div>}
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {["Full Name","Street Address","City, Province, Postal Code"].map(ph => (
                <input key={ph} placeholder={ph} style={{ border:"1px solid #bbb", borderRadius:8, padding:"10px 12px", fontSize:14, width:"100%", boxSizing:"border-box" }} />
              ))}
            </div>
          </div>
          <div style={{ background:"#fff", border:"1px solid #ddd", borderRadius:10, padding:16 }}>
            <div style={{ fontWeight:700, marginBottom:10, fontSize:14 }}>Payment</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <input placeholder="Card number" style={{ border:"1px solid #bbb", borderRadius:8, padding:"10px 12px", fontSize:14, width:"100%", boxSizing:"border-box" }} />
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                <input placeholder="MM / YY" style={{ border:"1px solid #bbb", borderRadius:8, padding:"10px 12px", fontSize:14, width:"100%", boxSizing:"border-box" }} />
                <input placeholder="CVV" style={{ border:"1px solid #bbb", borderRadius:8, padding:"10px 12px", fontSize:14, width:"100%", boxSizing:"border-box" }} />
              </div>
            </div>
            <div style={{ marginTop:8, fontSize:11, color:"#888" }}>🔒 Your card is never charged — this is a simulation</div>
          </div>
        </div>
        <div style={{ background:"#fff", border:"1px solid #ddd", borderRadius:10, padding:16, alignSelf:"start" }}>
          <div style={{ fontWeight:700, marginBottom:10, fontSize:14 }}>Order summary</div>
          {cart.map(item => (
            <div key={item.id} style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:5 }}>
              <span style={{ color:"#555" }}>{item.img} {item.name.slice(0,26)}{item.name.length>26?"…":""}</span>
              <span style={{ flexShrink:0, marginLeft:8 }}>{fmtMoney(item.price*item.qty)}</span>
            </div>
          ))}
          <div style={{ borderTop:"1px solid #eee", marginTop:10, paddingTop:10, display:"flex", flexDirection:"column", gap:5 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}><span>Shipping</span><span style={{ color:"#007600" }}>FREE</span></div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}><span>Tax (GST+PST)</span><span>{fmtMoney(tax)}</span></div>
            <div style={{ display:"flex", justifyContent:"space-between", fontWeight:700, fontSize:16, marginTop:4 }}><span>Total</span><span style={{ color:"#c45500" }}>{fmtMoney(total+tax)}</span></div>
          </div>
          <button onClick={onPlace} style={{ width:"100%", marginTop:14, background:"#ffd814", border:"1px solid #ffa41c", borderRadius:24, padding:"12px 0", fontSize:15, fontWeight:700, cursor:"pointer" }}>
            Place your order
          </button>
          <div style={{ fontSize:10, color:"#aaa", textAlign:"center", marginTop:8 }}>Nothing will be charged or shipped.</div>
        </div>
      </div>
    </div>
  );
}

// ── TRACKING ──────────────────────────────────────────────────────────────────
function TrackingPage({ orderRef, onDeliver }) {
  const [step, setStep] = useState(3);
  const advance = () => step >= TRACKING_STEPS.length-1 ? onDeliver() : setStep(s => s+1);
  return (
    <div style={{ maxWidth:480, margin:"0 auto", padding:"28px 16px" }}>
      <div style={{ fontSize:11, color:"#888", marginBottom:3 }}>Order #{orderRef}</div>
      <h2 style={{ fontSize:20, fontWeight:700, marginBottom:16 }}>📍 Package Tracking</h2>
      <div style={{ background:"#f0f9f0", border:"1px solid #c3e6cb", borderRadius:8, padding:"10px 14px", marginBottom:20, fontSize:13, color:"#1a6633" }}>
        Estimated delivery: <strong>Tomorrow by 8pm</strong>
      </div>
      {TRACKING_STEPS.map((label, i) => {
        const done = i < step; const active = i === step;
        return (
          <div key={i} style={{ display:"flex", gap:12 }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
              <div style={{ width:18, height:18, borderRadius:"50%", border:"2px solid", borderColor:done||active?"#007600":"#ddd", background:done?"#007600":"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"#fff", flexShrink:0 }}>{done?"✓":""}</div>
              {i < TRACKING_STEPS.length-1 && <div style={{ width:2, flex:1, minHeight:24, background:done?"#007600":"#e8e8e8" }} />}
            </div>
            <div style={{ paddingBottom:20 }}>
              <div style={{ fontWeight:active?700:done?500:400, fontSize:13, color:active?"#007600":done?"#0f1111":"#bbb" }}>{label}</div>
            </div>
          </div>
        );
      })}
      <button onClick={advance} style={{ width:"100%", background:"#232f3e", color:"#fff", border:"none", borderRadius:24, padding:"12px 0", fontSize:14, fontWeight:600, cursor:"pointer", marginTop:4 }}>
        {step >= TRACKING_STEPS.length-1 ? "📬 Mark as Delivered" : "Fast Forward ⚡"}
      </button>
    </div>
  );
}

// ── RECEIPT MODAL ─────────────────────────────────────────────────────────────
function ReceiptModal({ cart, user, onClose }) {
  const [copied, setCopied] = useState(false);
  const text = buildReceiptText(cart, user?.name);
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = subtotal * 0.12;
  const copy = () => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };
  const share = () => { if (navigator.share) { navigator.share({ title:"My ZeroCart Dopamine Receipt", text }).catch(()=>{}); } else { copy(); } };
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"#fff", borderRadius:14, width:"100%", maxWidth:380, boxShadow:"0 12px 40px rgba(0,0,0,0.25)", overflow:"hidden" }}>
        <div style={{ background:"#232f3e", padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ color:"#ff9900", fontWeight:900, fontSize:18, letterSpacing:-1 }}>zerocart<span style={{ color:"#fff" }}>.</span></div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#aaa", fontSize:22, cursor:"pointer" }}>×</button>
        </div>
        <div style={{ padding:"20px 22px", fontFamily:"monospace", fontSize:12, lineHeight:1.7, background:"#fffdf5", borderBottom:"2px dashed #e0d9c8" }}>
          <div style={{ textAlign:"center", marginBottom:12 }}>
            <div style={{ fontSize:28 }}>🧾</div>
            <div style={{ fontWeight:700, fontSize:14, marginTop:4 }}>DOPAMINE RECEIPT</div>
            <div style={{ color:"#888", fontSize:11 }}>{new Date().toLocaleDateString("en-CA", { month:"long", day:"numeric", year:"numeric" })}</div>
            {user && <div style={{ color:"#888", fontSize:11 }}>Shopper: {user.name}</div>}
          </div>
          <div style={{ borderTop:"1px dashed #ccc", paddingTop:10, marginBottom:10 }}>
            {cart.map(item => (
              <div key={item.id} style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:200 }}>{item.img} {item.name.slice(0,22)}{item.name.length>22?"…":""}</span>
                <span style={{ flexShrink:0, marginLeft:8 }}>{fmtMoney(item.price*item.qty)}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop:"1px dashed #ccc", paddingTop:8 }}>
            <div style={{ display:"flex", justifyContent:"space-between" }}><span>Subtotal</span><span>{fmtMoney(subtotal)}</span></div>
            <div style={{ display:"flex", justifyContent:"space-between" }}><span>Tax</span><span>{fmtMoney(tax)}</span></div>
            <div style={{ display:"flex", justifyContent:"space-between", fontWeight:700, fontSize:14, marginTop:4 }}><span>FAKE TOTAL</span><span>{fmtMoney(subtotal+tax)}</span></div>
            <div style={{ display:"flex", justifyContent:"space-between", color:"#007600", fontWeight:700 }}><span>REAL COST</span><span>$0.00</span></div>
          </div>
          <div style={{ textAlign:"center", marginTop:14, fontSize:11, color:"#888", lineHeight:1.5 }}>Nothing shipped. No boxes coming.<br />Just the good feeling — for free.</div>
        </div>
        <div style={{ height:12, background:"repeating-linear-gradient(90deg, #fffdf5 0px, #fffdf5 10px, transparent 10px, transparent 20px)", backgroundSize:"20px 12px" }} />
        <div style={{ padding:"14px 20px 18px", display:"flex", flexDirection:"column", gap:8 }}>
          <button onClick={share} style={{ background:"#232f3e", color:"#fff", border:"none", borderRadius:24, padding:"12px 0", fontSize:14, fontWeight:700, cursor:"pointer" }}>📤 Share Receipt</button>
          <button onClick={copy} style={{ background:copied?"#2da44e":"#f5f5f5", color:copied?"#fff":"#333", border:"1px solid #ddd", borderRadius:24, padding:"11px 0", fontSize:14, fontWeight:600, cursor:"pointer", transition:"all 0.2s" }}>{copied ? "✓ Copied!" : "📋 Copy as Text"}</button>
        </div>
      </div>
    </div>
  );
}

// ── REVEAL ────────────────────────────────────────────────────────────────────
function RevealPage({ cart, user, totalSaved, onReset, onHistory, onWishlist }) {
  const [showReceipt, setShowReceipt] = useState(false);
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const items = cart.reduce((s, i) => s + i.qty, 0);
  return (
    <div style={{ maxWidth:520, margin:"0 auto", padding:"32px 16px", textAlign:"center" }}>
      <div style={{ fontSize:64, marginBottom:6 }}>🎉</div>
      <h2 style={{ fontSize:24, fontWeight:800, marginBottom:6 }}>Your package has arrived!</h2>
      <p style={{ color:"#666", fontSize:14, marginBottom:24 }}>…except it hasn't. Nothing is coming. That was the whole point.</p>

      {/* Savings hero */}
      <div style={{ background:"linear-gradient(135deg, #232f3e 0%, #1a6633 100%)", color:"#fff", borderRadius:14, padding:22, marginBottom:18, textAlign:"left" }}>
        <div style={{ fontSize:10, letterSpacing:1.5, color:"#aaa", marginBottom:10, textTransform:"uppercase" }}>Your Dopamine Report</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {[
            { label:"This session", value: fmtMoney(total*1.12) },
            { label:"Real spend", value: "$0.00" },
            { label:"Total saved ever", value: fmtMoney(totalSaved) },
            { label:"Clutter avoided", value: `${items} item${items>1?"s":""}` }
          ].map(s => (
            <div key={s.label} style={{ background:"rgba(255,255,255,0.08)", borderRadius:10, padding:"12px 14px" }}>
              <div style={{ fontSize:20, fontWeight:800, color:"#ffd814" }}>{s.value}</div>
              <div style={{ fontSize:11, color:"#aaa", marginTop:3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background:"#fffbee", border:"1px solid #f0c040", borderRadius:12, padding:16, marginBottom:18, textAlign:"left" }}>
        <div style={{ fontWeight:700, fontSize:13, marginBottom:6 }}>💡 What were you actually craving?</div>
        <p style={{ fontSize:13, color:"#555", margin:0, lineHeight:1.6 }}>The urge to order is rarely about the object. It's novelty, control, or a sense of forward motion. You got the feeling — without the clutter or regret.</p>
      </div>

      {user?.panelist && (
        <div style={{ background:"#f0f4ff", border:"1px solid #c0ccff", borderRadius:12, padding:14, marginBottom:18, textAlign:"left" }}>
          <div style={{ fontWeight:700, fontSize:13, marginBottom:4 }}>📊 Thanks, panelist!</div>
          <p style={{ fontSize:12, color:"#555", margin:0 }}>Your anonymous cart data has been added to this month's brand insights.</p>
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        <button onClick={() => setShowReceipt(true)} style={{ background:"#ff9900", border:"none", borderRadius:24, padding:"13px 0", fontSize:15, fontWeight:700, cursor:"pointer", color:"#fff" }}>🧾 Get Shareable Receipt</button>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <button onClick={onReset} style={{ background:"#ffd814", border:"1px solid #ffa41c", borderRadius:24, padding:"12px 0", fontSize:14, fontWeight:700, cursor:"pointer" }}>Shop again 🛒</button>
          {user && <button onClick={onWishlist} style={{ background:"#fff0f7", border:"1px solid #f5a0cc", borderRadius:24, padding:"12px 0", fontSize:14, fontWeight:600, cursor:"pointer", color:"#c0397a" }}>♥ My Wishlist</button>}
        </div>
        {user && <button onClick={onHistory} style={{ background:"#fff", border:"1px solid #ccc", borderRadius:24, padding:"11px 0", fontSize:13, fontWeight:500, cursor:"pointer", color:"#555" }}>Order history</button>}
      </div>
      {showReceipt && <ReceiptModal cart={cart} user={user} onClose={() => setShowReceipt(false)} />}
    </div>
  );
}

// ── WISHLIST PAGE ─────────────────────────────────────────────────────────────
function WishlistPage({ user, onBack }) {
  const [wishlist, setWishlist] = useState(() => loadJSON(WISHLIST_KEY + (user?.id||""), []));
  const [copied, setCopied] = useState(false);

  const remove = (id) => {
    const updated = wishlist.filter(i => i.id !== id);
    setWishlist(updated);
    saveJSON(WISHLIST_KEY + (user?.id||""), updated);
  };

  const totalValue = wishlist.reduce((s, i) => s + i.price, 0);

  const exportText = () => {
    if (wishlist.length === 0) return "";
    const lines = wishlist.map(i => {
      const q = encodeURIComponent(i.name);
      return `${i.img} ${i.name} — ${fmtMoney(i.price)}\n   Amazon: https://www.amazon.com/s?k=${q}&tag=zerocart-20`;
    });
    return `✨ My ZeroCart Wishlist\nSaved on ${new Date().toLocaleDateString("en-CA", { month:"long", day:"numeric", year:"numeric" })}\n\n${lines.join("\n\n")}\n\n━━━━━━━━━━━━━━━━━━━━\nTotal if purchased: ${fmtMoney(totalValue)}\n\nThese are things I actually want — not impulse buys.\nGenerated by zerocart. — shop the feeling, keep the cash`;
  };

  const copyList = () => {
    navigator.clipboard.writeText(exportText()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareList = () => {
    const text = exportText();
    if (navigator.share) {
      navigator.share({ title: "My ZeroCart Wishlist", text }).catch(() => {});
    } else {
      copyList();
    }
  };

  const downloadList = () => {
    const text = exportText();
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "my-zerocart-wishlist.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth:640, margin:"0 auto", padding:"20px 14px" }}>
      <button onClick={onBack} style={{ background:"none", border:"none", color:"#007185", cursor:"pointer", fontSize:13, marginBottom:14, padding:0 }}>← Back to shop</button>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:700, margin:0 }}>♥ My Wishlist</h2>
          <div style={{ fontSize:12, color:"#888", marginTop:4 }}>Stuff you actually might want — saved when the impulse passed</div>
        </div>
        {wishlist.length > 0 && (
          <div style={{ fontSize:13, fontWeight:700, color:"#c45500", textAlign:"right", flexShrink:0 }}>
            {wishlist.length} item{wishlist.length>1?"s":""}
            <div style={{ fontSize:11, color:"#888", fontWeight:400 }}>{fmtMoney(totalValue)} total</div>
          </div>
        )}
      </div>

      {wishlist.length === 0 ? (
        <div style={{ textAlign:"center", padding:"60px 20px", color:"#888" }}>
          <div style={{ fontSize:48 }}>🤍</div>
          <div style={{ marginTop:10, fontWeight:600 }}>Your wishlist is empty</div>
          <div style={{ fontSize:13, marginTop:6 }}>Tap the ♡ on any product to save it for later.</div>
        </div>
      ) : (
        <>
          {/* Export actions */}
          <div style={{ background:"#f8f4ff", border:"1px solid #d0b4f5", borderRadius:12, padding:14, marginBottom:18 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:4, color:"#5a2d8a" }}>Ready to actually buy something?</div>
            <div style={{ fontSize:12, color:"#666", marginBottom:12, lineHeight:1.5 }}>These survived the impulse test — each one includes an Amazon link so you can look it up properly before deciding.</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:8 }}>
              <button onClick={shareList} style={{ background:"#7c3aed", color:"#fff", border:"none", borderRadius:20, padding:"10px 0", fontSize:12, fontWeight:700, cursor:"pointer" }}>📤 Share</button>
              <button onClick={copyList} style={{ background:copied?"#2da44e":"#fff", color:copied?"#fff":"#555", border:"1px solid #ddd", borderRadius:20, padding:"10px 0", fontSize:12, fontWeight:600, cursor:"pointer" }}>{copied?"✓ Copied":"📋 Copy"}</button>
              <button onClick={downloadList} style={{ background:"#fff", color:"#555", border:"1px solid #ddd", borderRadius:20, padding:"10px 0", fontSize:12, fontWeight:600, cursor:"pointer" }}>⬇️ Download</button>
            </div>
          </div>

          {/* Items */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {wishlist.map(item => {
              const q = encodeURIComponent(item.name);
              const amazonUrl = `https://www.amazon.com/s?k=${q}&tag=zerocart-20`;
              return (
                <div key={item.id} style={{ background:"#fff", border:"1px solid #eee", borderRadius:12, padding:14, display:"flex", gap:12, alignItems:"center" }}>
                  <div style={{ fontSize:32, flexShrink:0 }}>{item.img}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, lineHeight:1.3, marginBottom:4 }}>{item.name}</div>
                    <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                      <span style={{ fontWeight:700, color:"#c45500" }}>{fmtMoney(item.price)}</span>
                      <Stars rating={item.rating} />
                    </div>
                    <a href={amazonUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:"#007185", textDecoration:"none", display:"inline-block", marginTop:4 }}>
                      Search on Amazon →
                    </a>
                  </div>
                  <button onClick={() => remove(item.id)} style={{ background:"none", border:"none", color:"#ccc", fontSize:20, cursor:"pointer", flexShrink:0, padding:4 }} title="Remove">×</button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── ORDER HISTORY ─────────────────────────────────────────────────────────────
function HistoryPage({ user, onBack, onWishlist }) {
  const allOrders = loadJSON(ORDERS_KEY, []);
  const orders = allOrders.filter(o => o.userId === user.id).reverse();
  const lifetime = orders.reduce((s, o) => s + o.total, 0);
  return (
    <div style={{ maxWidth:640, margin:"0 auto", padding:"20px 14px" }}>
      <button onClick={onBack} style={{ background:"none", border:"none", color:"#007185", cursor:"pointer", fontSize:13, marginBottom:14, padding:0 }}>← Back to shop</button>
      <h2 style={{ fontSize:20, fontWeight:700, marginBottom:16 }}>Order History</h2>
      {orders.length===0 ? (
        <div style={{ textAlign:"center", padding:"60px 20px", color:"#888" }}>
          <div style={{ fontSize:48 }}>📭</div>
          <div style={{ marginTop:10, fontWeight:600 }}>No orders yet</div>
          <div style={{ fontSize:13, marginTop:6 }}>Go treat yourself — it's free.</div>
        </div>
      ) : (
        <>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {orders.map(order => (
              <div key={order.id} style={{ background:"#fff", border:"1px solid #ddd", borderRadius:12, padding:16 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:11, color:"#888", letterSpacing:0.5 }}>ORDER #{order.id.toUpperCase()}</div>
                    <div style={{ fontSize:12, color:"#555", marginTop:2 }}>{fmtDate(order.placedAt)}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontWeight:700, fontSize:15 }}>{fmtMoney(order.total)}</div>
                    <div style={{ fontSize:11, color:"#007600", marginTop:2 }}>✓ Fake-Delivered</div>
                  </div>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {order.items.map(item => (
                    <span key={item.id} style={{ background:"#f5f5f5", borderRadius:6, padding:"4px 10px", fontSize:11 }}>{item.img} {item.name.slice(0,20)}{item.name.length>20?"…":""}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:18, background:"#232f3e", color:"#fff", borderRadius:12, padding:18 }}>
            <div style={{ fontSize:10, color:"#aaa", letterSpacing:1.5, textTransform:"uppercase", marginBottom:12 }}>Lifetime Stats</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
              {[{ label:"Sessions", value: orders.length },{ label:"Fake spent", value: fmtMoney(lifetime) },{ label:"Real spent", value: "$0.00" }].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize:20, fontWeight:800, color:"#ffd814" }}>{s.value}</div>
                  <div style={{ fontSize:11, color:"#aaa", marginTop:3 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop:12, textAlign:"center" }}>
            <button onClick={onWishlist} style={{ background:"#fff0f7", border:"1px solid #f5a0cc", borderRadius:24, padding:"11px 24px", fontSize:14, fontWeight:600, cursor:"pointer", color:"#c0397a" }}>♥ View My Wishlist</button>
          </div>
        </>
      )}
    </div>
  );
}

// ── BRAND DASHBOARD ───────────────────────────────────────────────────────────
function BrandDashboard({ onClose }) {
  const [activeTab, setActiveTab] = useState("overview");
  const orders = loadJSON(ORDERS_KEY, []);
  const users  = loadJSON(USERS_KEY, {});
  const panelists = Object.values(users).filter(u => u.panelist);
  const panelistIds = new Set(panelists.map(u => u.id));
  const panelistOrders = orders.filter(o => panelistIds.has(o.userId));

  const signals = [];
  panelistOrders.forEach(order => {
    const u = panelists.find(u => u.id === order.userId);
    const bracket = u ? ageBracket(u.age) : null;
    order.items.forEach(item => signals.push({ ...item, bracket }));
  });
  const totalSignals = signals.length;

  const catCounts = {};
  signals.forEach(s => { catCounts[s.category] = (catCounts[s.category]||0) + s.qty; });
  const topCats = Object.entries(catCounts).sort((a,b) => b[1]-a[1]);
  const maxCat  = topCats[0]?.[1] || 1;

  const priceBuckets = { "Under $15":0, "$15–$25":0, "$25–$35":0, "$35–$60":0, "$60+":0 };
  signals.forEach(s => {
    const p = s.price;
    if (p<15) priceBuckets["Under $15"]+=s.qty;
    else if (p<25) priceBuckets["$15–$25"]+=s.qty;
    else if (p<35) priceBuckets["$25–$35"]+=s.qty;
    else if (p<60) priceBuckets["$35–$60"]+=s.qty;
    else priceBuckets["$60+"]+= s.qty;
  });
  const topBucket = Object.entries(priceBuckets).sort((a,b)=>b[1]-a[1])[0];

  const ageMatrix = {};
  AGE_BRACKETS.forEach(b => { ageMatrix[b] = {}; });
  signals.forEach(s => { if (!s.bracket) return; ageMatrix[s.bracket][s.category] = (ageMatrix[s.bracket][s.category]||0) + s.qty; });
  const ageTotals = {};
  AGE_BRACKETS.forEach(b => { ageTotals[b] = Object.values(ageMatrix[b]).reduce((s,v)=>s+v,0); });
  const maxAge = Math.max(...Object.values(ageTotals), 1);

  const catAgeBreakdown = {};
  topCats.forEach(([cat]) => { catAgeBreakdown[cat] = {}; AGE_BRACKETS.forEach(b => { catAgeBreakdown[cat][b] = ageMatrix[b][cat]||0; }); });
  const catDominantAge = {};
  topCats.forEach(([cat]) => {
    catDominantAge[cat] = AGE_BRACKETS.reduce((best,b) => (catAgeBreakdown[cat][b] > (catAgeBreakdown[cat][best]||0)) ? b : best, AGE_BRACKETS[0]);
  });

  const TAB = (t, label) => (
    <button key={t} onClick={() => setActiveTab(t)} style={{ background:activeTab===t?"#1a1f36":"transparent", color:activeTab===t?"#fff":"#a0aec0", border:"none", borderRadius:6, padding:"7px 14px", fontSize:12, fontWeight:activeTab===t?700:400, cursor:"pointer", whiteSpace:"nowrap" }}>{label}</button>
  );

  const empty = (
    <div style={{ textAlign:"center", padding:"40px 20px", color:"#888", background:"#f8fafc", borderRadius:10 }}>
      <div style={{ fontSize:40 }}>📊</div>
      <div style={{ marginTop:10, fontWeight:600 }}>No panelist data yet</div>
      <div style={{ fontSize:12, marginTop:6 }}>Sign up with Insight Panel checked and complete a few orders.</div>
    </div>
  );

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:200, display:"flex", alignItems:"flex-start", justifyContent:"center", overflowY:"auto", padding:"20px 12px" }}>
      <div style={{ background:"#fff", borderRadius:14, width:"100%", maxWidth:740, boxShadow:"0 12px 40px rgba(0,0,0,0.25)", overflow:"hidden" }}>
        <div style={{ background:"#1a1f36", padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ color:"#a0aec0", fontSize:10, letterSpacing:2, textTransform:"uppercase" }}>ZeroCart · For Brands</div>
            <div style={{ color:"#fff", fontSize:18, fontWeight:800, marginTop:2 }}>Purchase Intent Dashboard</div>
            <div style={{ color:"#a0aec0", fontSize:11, marginTop:2 }}>Opt-in panelist data only · No personal information</div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.1)", border:"none", color:"#fff", borderRadius:8, padding:"8px 14px", cursor:"pointer", fontSize:13, flexShrink:0 }}>Close</button>
        </div>
        <div style={{ background:"#0f1629", padding:"8px 20px", display:"flex", gap:4, overflowX:"auto" }}>
          {TAB("overview","Overview")} {TAB("age","Age Breakdown")} {TAB("price","Price Sensitivity")}
        </div>
        <div style={{ padding:18, display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
            {[{ label:"Sessions", value:panelistOrders.length, sub:"completed orders" },{ label:"Intent Signals", value:totalSignals, sub:"cart-add events" },{ label:"Panel Size", value:panelists.length, sub:"opted-in users" }].map(k => (
              <div key={k.label} style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:10, padding:"12px 14px" }}>
                <div style={{ fontSize:24, fontWeight:800, color:"#1a1f36" }}>{k.value}</div>
                <div style={{ fontSize:12, fontWeight:600, color:"#444", marginTop:2 }}>{k.label}</div>
                <div style={{ fontSize:11, color:"#888" }}>{k.sub}</div>
              </div>
            ))}
          </div>
          {totalSignals===0 ? empty : (<>
            {activeTab==="overview" && (
              <>
                <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:10, padding:16 }}>
                  <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Category Demand</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {topCats.map(([cat,count]) => (
                      <div key={cat}>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
                          <span style={{ fontWeight:600 }}>{cat}</span>
                          <span style={{ color:"#888" }}>{count} signals · peak <strong style={{ color:"#1a1f36" }}>{catDominantAge[cat]}</strong></span>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <MiniBar value={count} max={maxCat} color={CAT_COLORS[cat]||"#888"} />
                          <span style={{ fontSize:11, color:"#888", whiteSpace:"nowrap" }}>{Math.round((count/totalSignals)*100)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ background:"#fffbee", border:"1px solid #f0c040", borderRadius:10, padding:14 }}>
                  <div style={{ fontWeight:700, fontSize:13, marginBottom:6 }}>💡 Top Insight</div>
                  <p style={{ fontSize:13, color:"#555", margin:0, lineHeight:1.6 }}>
                    <strong>{topCats[0]?.[0]}</strong> leads purchase intent, driven primarily by the <strong>{catDominantAge[topCats[0]?.[0]]}</strong> age group. Most signals fall in the <strong>{topBucket?.[0]}</strong> price band.
                  </p>
                </div>
              </>
            )}
            {activeTab==="age" && (
              <>
                <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:10, padding:16 }}>
                  <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Intent Volume by Age Group</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {AGE_BRACKETS.map(b => (
                      <div key={b}>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
                          <span style={{ fontWeight:600 }}>Age {b}</span><span style={{ color:"#888" }}>{ageTotals[b]} signals</span>
                        </div>
                        <MiniBar value={ageTotals[b]} max={maxAge} color="#1a1f36" />
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ background:"#fffbee", border:"1px solid #f0c040", borderRadius:10, padding:14 }}>
                  <div style={{ fontWeight:700, fontSize:13, marginBottom:6 }}>💡 Age Insight</div>
                  <p style={{ fontSize:13, color:"#555", margin:0, lineHeight:1.6 }}>If Electronics skews 18-34, invest in Instagram and TikTok placements over search.</p>
                </div>
              </>
            )}
            {activeTab==="price" && (
              <>
                <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:10, padding:16 }}>
                  <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Overall Price Band Intent</div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8 }}>
                    {Object.entries(priceBuckets).map(([band,count]) => {
                      const isPeak = band===topBucket?.[0];
                      return (
                        <div key={band} style={{ background:"#fff", border:"2px solid", borderColor:isPeak?"#ff9900":"#e2e8f0", borderRadius:8, padding:"10px 6px", textAlign:"center" }}>
                          <div style={{ fontSize:18, fontWeight:800, color:isPeak?"#ff9900":"#1a1f36" }}>{count}</div>
                          <div style={{ fontSize:10, color:"#888", marginTop:2 }}>{band}</div>
                          {isPeak && <div style={{ fontSize:9, color:"#ff9900", fontWeight:700, marginTop:4 }}>PEAK</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={{ background:"#fffbee", border:"1px solid #f0c040", borderRadius:10, padding:14 }}>
                  <div style={{ fontWeight:700, fontSize:13, marginBottom:6 }}>💡 Pricing Insight</div>
                  <p style={{ fontSize:13, color:"#555", margin:0, lineHeight:1.6 }}>A small price reduction or bundle into the peak band could unlock a much larger segment of buyers.</p>
                </div>
              </>
            )}
          </>)}
        </div>
      </div>
    </div>
  );
}

// ── AUTH MODAL ────────────────────────────────────────────────────────────────
function AuthModal({ onAuth, onClose }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name:"", email:"", password:"", age:"", panelist:false });
  const [error, setError] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]:v }));

  const submit = () => {
    setError("");
    const users = loadJSON(USERS_KEY, {});
    if (mode === "signup") {
      if (!form.name || !form.email || !form.password || !form.age) return setError("Please fill in all fields.");
      if (users[form.email]) return setError("That email is already registered.");
      const user = { id:uid(), name:form.name, email:form.email, password:form.password, age:form.age, panelist:form.panelist, joinedAt:new Date().toISOString() };
      users[form.email] = user; saveJSON(USERS_KEY, users); onAuth(user);
    } else {
      if (!form.email || !form.password) return setError("Enter your email and password.");
      const user = users[form.email];
      if (!user || user.password !== form.password) return setError("Email or password is incorrect.");
      onAuth(user);
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"#fff", borderRadius:14, padding:24, width:"100%", maxWidth:360, boxShadow:"0 8px 32px rgba(0,0,0,0.2)", position:"relative" }}>
        <button onClick={onClose} style={{ position:"absolute", top:12, right:14, background:"none", border:"none", fontSize:22, cursor:"pointer", color:"#aaa" }}>×</button>
        <div style={{ textAlign:"center", marginBottom:18 }}>
          <div style={{ fontSize:22, fontWeight:900, color:"#ff9900", letterSpacing:-1 }}>zerocart<span style={{ color:"#232f3e" }}>.</span></div>
          <div style={{ fontSize:17, fontWeight:700, marginTop:5 }}>{mode==="login" ? "Sign in" : "Create account"}</div>
        </div>
        {error && <div style={{ background:"#fff3cd", border:"1px solid #ffc107", borderRadius:6, padding:"8px 12px", fontSize:12, marginBottom:10, color:"#856404" }}>{error}</div>}
        <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
          {mode==="signup" && <>
            <input placeholder="Full name" value={form.name} onChange={e => set("name", e.target.value)} style={{ border:"1px solid #ccc", borderRadius:8, padding:"10px 12px", fontSize:14, width:"100%", boxSizing:"border-box" }} />
            <input placeholder="Your age" type="number" value={form.age} onChange={e => set("age", e.target.value)} style={{ border:"1px solid #ccc", borderRadius:8, padding:"10px 12px", fontSize:14, width:"100%", boxSizing:"border-box" }} />
          </>}
          <input placeholder="Email" value={form.email} onChange={e => set("email", e.target.value)} style={{ border:"1px solid #ccc", borderRadius:8, padding:"10px 12px", fontSize:14, width:"100%", boxSizing:"border-box" }} />
          <input placeholder="Password" type="password" value={form.password} onChange={e => set("password", e.target.value)} style={{ border:"1px solid #ccc", borderRadius:8, padding:"10px 12px", fontSize:14, width:"100%", boxSizing:"border-box" }} />
          {mode==="signup" && (
            <label style={{ display:"flex", gap:10, alignItems:"flex-start", fontSize:12, color:"#444", cursor:"pointer", background:"#f8f4ff", borderRadius:8, padding:"10px 12px", border:"1px solid #d0b4f5" }}>
              <input type="checkbox" checked={form.panelist} onChange={e => set("panelist", e.target.checked)} style={{ marginTop:2, flexShrink:0 }} />
              <span><strong>Join the Insight Panel (optional)</strong> — anonymously share cart trends with brands to help them price things better.</span>
            </label>
          )}
          <button onClick={submit} style={{ background:"#ffd814", border:"1px solid #ffa41c", borderRadius:24, padding:"11px 0", fontSize:15, fontWeight:700, cursor:"pointer", marginTop:4 }}>
            {mode==="login" ? "Sign in" : "Create account"}
          </button>
        </div>
        <div style={{ textAlign:"center", marginTop:12, fontSize:12, color:"#666" }}>
          {mode==="login"
            ? <>No account? <span onClick={() => { setMode("signup"); setError(""); }} style={{ color:"#007185", cursor:"pointer", textDecoration:"underline" }}>Create one</span></>
            : <>Already registered? <span onClick={() => { setMode("login"); setError(""); }} style={{ color:"#007185", cursor:"pointer", textDecoration:"underline" }}>Sign in</span></>}
        </div>
      </div>
    </div>
  );
}

// ── APP ROOT ──────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView]               = useState("browse");
  const [cart, setCart]               = useState([]);
  const [user, setUser]               = useState(null);
  const [showCart, setShowCart]       = useState(false);
  const [showAuth, setShowAuth]       = useState(false);
  const [showDash, setShowDash]       = useState(false);
  const [showImpulse, setShowImpulse] = useState(false);
  const [search, setSearch]           = useState("");
  const [category, setCategory]       = useState("All");
  const [currentOrder, setCurrentOrder] = useState(null);
  const [wishlist, setWishlist]       = useState(() => loadJSON(WISHLIST_KEY + (user?.id||""), []));

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const wishlistIds = new Set(wishlist.map(i => i.id));

  // Compute total saved (all-time fake spend for this user)
  const allOrders = loadJSON(ORDERS_KEY, []);
  const myOrders = user ? allOrders.filter(o => o.userId === user.id) : [];
  const totalSaved = myOrders.reduce((s, o) => s + o.total, 0);

  const addToCart = p => setCart(prev => {
    const ex = prev.find(i => i.id===p.id);
    return ex ? prev.map(i => i.id===p.id ? { ...i, qty:i.qty+1 } : i) : [...prev, { ...p, qty:1 }];
  });
  const removeFromCart = id => setCart(prev => prev.filter(i => i.id!==id));

  const toggleWishlist = (product) => {
    const key = WISHLIST_KEY + (user?.id||"guest");
    const existing = loadJSON(key, []);
    const isIn = existing.find(i => i.id === product.id);
    const updated = isIn ? existing.filter(i => i.id !== product.id) : [...existing, product];
    saveJSON(key, updated);
    setWishlist(updated);
  };

  const handleCheckoutIntent = () => {
    setShowCart(false);
    if (!user) { setShowAuth(true); return; }
    setShowImpulse(true);
  };

  const handleImpulseGood = () => {
    const log = loadJSON(IMPULSE_KEY, []);
    log.push({ at: new Date().toISOString(), cartTotal: cart.reduce((s,i)=>s+i.price*i.qty,0), itemCount: cart.reduce((s,i)=>s+i.qty,0), userId: user?.id||"guest" });
    saveJSON(IMPULSE_KEY, log);
    setShowImpulse(false);
    setView("checkout");
  };

  const handleImpulseSaveWishlist = () => {
    const key = WISHLIST_KEY + (user?.id||"guest");
    const existing = loadJSON(key, []);
    const existingIds = new Set(existing.map(i => i.id));
    const toAdd = cart.filter(i => !existingIds.has(i.id));
    const updated = [...existing, ...toAdd];
    saveJSON(key, updated);
    setWishlist(updated);
    setShowImpulse(false);
    setCart([]);
    setView("wishlist");
  };

  const placeOrder = () => {
    const total = cart.reduce((s, i) => s + i.price*i.qty, 0) * 1.12;
    const order = { id:newOrder(), userId:user?.id||"guest", placedAt:new Date().toISOString(), items:cart, total };
    const orders = loadJSON(ORDERS_KEY, []); orders.push(order); saveJSON(ORDERS_KEY, orders);
    setCurrentOrder(order); setView("confirm");
  };

  const reset = () => { setCart([]); setView("browse"); setShowCart(false); setSearch(""); setCategory("All"); };

  const filtered = PRODUCTS.filter(p =>
    (category==="All" || p.category===category) &&
    (search==="" || p.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ fontFamily:"Arial, sans-serif", background:"#f0f2f2", minHeight:"100vh" }}>

      {/* NAV */}
      <div style={{ background:"#232f3e", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, height:52, maxWidth:1200, margin:"0 auto", padding:"0 12px" }}>
          <div onClick={reset} style={{ color:"#ff9900", fontWeight:900, fontSize:20, cursor:"pointer", letterSpacing:-1, flexShrink:0 }}>
            zerocart<span style={{ color:"#fff" }}>.</span>
          </div>
          {view==="browse" && (
            <div style={{ flex:1, display:"flex", maxWidth:500 }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search 177 products…"
                style={{ flex:1, padding:"7px 12px", fontSize:14, border:"none", borderRadius:"6px 0 0 6px", outline:"none", minWidth:0 }} />
              <div style={{ background:"#febd69", padding:"0 12px", borderRadius:"0 6px 6px 0", display:"flex", alignItems:"center" }}>🔍</div>
            </div>
          )}
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
            {user ? (
              <span onClick={() => setView("history")} style={{ color:"#fff", fontSize:12, cursor:"pointer", whiteSpace:"nowrap" }}>Hi, {user.name.split(" ")[0]}</span>
            ) : (
              <span onClick={() => setShowAuth(true)} style={{ color:"#fff", fontSize:12, cursor:"pointer", whiteSpace:"nowrap" }}>Sign in</span>
            )}
            {user && (
              <span onClick={() => setView("wishlist")} style={{ color:"#f5a0cc", fontSize:18, cursor:"pointer", position:"relative" }} title="My Wishlist">
                ♥
                {wishlist.length > 0 && <span style={{ position:"absolute", top:-6, right:-8, background:"#e84393", color:"#fff", borderRadius:"50%", width:14, height:14, display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, fontWeight:800 }}>{wishlist.length}</span>}
              </span>
            )}
            <span onClick={() => setShowDash(true)} style={{ color:"#febd69", fontSize:11, cursor:"pointer", border:"1px solid #febd69", borderRadius:4, padding:"3px 8px", whiteSpace:"nowrap" }}>📊 Brands</span>
            <div onClick={() => view==="browse" && setShowCart(true)} style={{ color:"#fff", display:"flex", alignItems:"center", gap:3, cursor:"pointer", position:"relative" }}>
              <span style={{ fontSize:20 }}>🛒</span>
              {cartCount>0 && <span style={{ position:"absolute", top:-8, right:-8, background:"#ff9900", color:"#fff", borderRadius:"50%", width:16, height:16, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:800 }}>{cartCount}</span>}
            </div>
          </div>
        </div>

        {/* CATEGORY TABS */}
        {view==="browse" && (
          <div style={{ display:"flex", gap:4, overflowX:"auto", padding:"0 12px 8px", maxWidth:1200, margin:"0 auto" }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)} style={{ background:category===cat?"#febd69":"rgba(255,255,255,0.08)", border:"none", color:category===cat?"#0f1111":"#ddd", borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:category===cat?700:400, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>{cat}</button>
            ))}
          </div>
        )}
      </div>

      {/* PAGES */}
      {view==="browse" && (
        <div style={{ maxWidth:1200, margin:"0 auto", padding:"16px 12px" }}>
          {user && <SavingsBanner userId={user.id} />}
          <div style={{ background:"#fff3cd", border:"1px solid #ffc107", borderRadius:8, padding:"9px 14px", marginBottom:14, fontSize:12, color:"#856404" }}>
            ✨ <strong>ZeroCart</strong> — {filtered.length} product{filtered.length!==1?"s":""} {category!=="All"?`in ${category}`:"across 16 departments"}. Shop freely. Nothing ships. Pure dopamine, zero clutter.
            {!user && <> · <span onClick={() => setShowAuth(true)} style={{ cursor:"pointer", textDecoration:"underline" }}>Sign in</span> to track your savings.</>}
          </div>
          {filtered.length===0
            ? <div style={{ textAlign:"center", padding:60, color:"#888" }}><div style={{ fontSize:48 }}>🔍</div><div>No results for "{search}"</div></div>
            : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(155px, 1fr))", gap:10 }}>
                {filtered.map(p => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onAdd={addToCart}
                    onWishlist={toggleWishlist}
                    wishlisted={wishlistIds.has(p.id)}
                  />
                ))}
              </div>
          }
        </div>
      )}

      {view==="checkout" && <CheckoutPage cart={cart} user={user} onPlace={placeOrder} />}

      {view==="confirm" && (
        <div style={{ maxWidth:480, margin:"0 auto", padding:"48px 16px", textAlign:"center" }}>
          <div style={{ fontSize:60 }}>📦</div>
          <h2 style={{ fontSize:22, fontWeight:700, color:"#007600", marginBottom:8 }}>Order confirmed!</h2>
          <p style={{ color:"#555", fontSize:14 }}>Order <strong>#{currentOrder?.id}</strong><br />Estimated delivery: <strong>Tomorrow by 8pm</strong></p>
          <button onClick={() => setView("tracking")} style={{ marginTop:20, background:"#ffd814", border:"1px solid #ffa41c", borderRadius:24, padding:"12px 36px", fontSize:15, fontWeight:700, cursor:"pointer" }}>Track your package</button>
        </div>
      )}

      {view==="tracking" && <TrackingPage orderRef={currentOrder?.id} onDeliver={() => setView("reveal")} />}
      {view==="reveal" && <RevealPage cart={cart} user={user} totalSaved={totalSaved} onReset={reset} onHistory={() => setView("history")} onWishlist={() => setView("wishlist")} />}
      {view==="history" && <HistoryPage user={user} onBack={() => setView("browse")} onWishlist={() => setView("wishlist")} />}
      {view==="wishlist" && <WishlistPage user={user} onBack={() => setView("browse")} />}

      {/* CART SIDEBAR */}
      {showCart && view==="browse" && (
        <>
          <div onClick={() => setShowCart(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:99 }} />
          <CartSidebar cart={cart} onRemove={removeFromCart} onClose={() => setShowCart(false)} onCheckout={handleCheckoutIntent} />
        </>
      )}

      {showAuth && <AuthModal onAuth={u => { setUser(u); setWishlist(loadJSON(WISHLIST_KEY+u.id, [])); setShowAuth(false); }} onClose={() => setShowAuth(false)} />}
      {showImpulse && <ImpulseCheckModal cart={cart} onGood={handleImpulseGood} onSaveWishlist={handleImpulseSaveWishlist} onKeepShopping={() => { setShowImpulse(false); setShowCart(true); }} />}
      {showDash && <BrandDashboard onClose={() => setShowDash(false)} />}
    </div>
  );
}
