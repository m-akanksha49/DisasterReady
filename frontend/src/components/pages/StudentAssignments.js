// src/components/pages/StudentAssignments.jsx
// Add this component to your student dashboard / route
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { auth } from "../../firebase";

const BASE = "http://localhost:5000";

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [userId,      setUserId]      = useState(null);
  const [updating,    setUpdating]    = useState(null); // assignment id being updated

  // Get current user's DB id
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) return;
      try {
        // Adjust this endpoint to match how you look up DB user by firebase uid
        const res = await axios.get(`${BASE}/api/users/me`, {
          headers: { Authorization: `Bearer ${await firebaseUser.getIdToken()}` }
        });
        setUserId(res.data.id);
      } catch (e) {
        console.error("Could not get user id:", e.message);
      }
    });
    return unsub;
  }, []);

  const fetchMyAssignments = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${BASE}/api/assignments/student/${userId}`);
      setAssignments(res.data);
    } catch (e) {
      console.error("fetchMyAssignments:", e.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchMyAssignments(); }, [fetchMyAssignments]);

  const updateProgress = async (assignmentId, progress, status) => {
    setUpdating(assignmentId);
    try {
      await axios.patch(
        `${BASE}/api/assignments/${assignmentId}/student/${userId}`,
        { progress, status }
      );
      await fetchMyAssignments();
    } catch (e) {
      alert("Update failed: " + e.message);
    } finally {
      setUpdating(null);
    }
  };

  const markDone = (assignmentId) => updateProgress(assignmentId, 100, "completed");
  const startTask = (assignmentId) => updateProgress(assignmentId, 10,  "in_progress");

  const statusStyle = (status) => {
    if (status === "completed")   return { bg:"#10b98122", color:"#10b981", label:"✅ Completed" };
    if (status === "in_progress") return { bg:"#3b82f622", color:"#3b82f6", label:"⏳ In Progress" };
    return { bg:"#f59e0b22", color:"#f59e0b", label:"📌 Not Started" };
  };

  if (loading) return (
    <div style={{textAlign:"center",padding:40,color:"#64748b"}}>Loading your assignments…</div>
  );

  return (
    <div style={{padding:24}}>
      <h2 style={{color:"#f1f5f9",fontWeight:700,fontSize:22,marginBottom:20}}>
        📋 My Assignments ({assignments.length})
      </h2>

      {assignments.length === 0 ? (
        <div style={{textAlign:"center",padding:"60px 20px",color:"#64748b"}}>
          <div style={{fontSize:52,marginBottom:12}}>📭</div>
          <p style={{fontSize:16}}>No assignments yet. Check back later!</p>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {assignments.map(asn => {
            const ss = statusStyle(asn.status);
            const isUpdating = updating === asn.assignment_id;
            return (
              <div key={asn.assignment_id} style={{
                background:"#0f1117",border:"1px solid #1e2535",borderRadius:14,padding:20
              }}>
                {/* Title + status */}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                  <div>
                    <h3 style={{color:"#f1f5f9",fontWeight:700,fontSize:16,margin:0}}>{asn.title}</h3>
                    {asn.description && (
                      <p style={{color:"#64748b",fontSize:13,margin:"5px 0 0"}}>{asn.description}</p>
                    )}
                    {asn.due_date && (
                      <p style={{color:"#f59e0b",fontSize:12,margin:"4px 0 0"}}>
                        📅 Due: {new Date(asn.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <span style={{background:ss.bg,color:ss.color,fontSize:12,fontWeight:700,
                    padding:"4px 10px",borderRadius:12,flexShrink:0,marginLeft:10}}>
                    {ss.label}
                  </span>
                </div>

                {/* Attachments */}
                {asn.file_name && (
                  <a href={`${BASE}${asn.file_url}`} target="_blank" rel="noreferrer"
                    style={{
                      display:"inline-flex",alignItems:"center",gap:6,
                      background:"#1e2535",border:"1px solid #2d3748",borderRadius:8,
                      padding:"7px 14px",color:"#3b82f6",fontSize:13,textDecoration:"none",
                      marginBottom:12
                    }}>
                    {asn.file_name.endsWith(".pdf") ? "📄" : asn.file_name.match(/\.pptx?$/) ? "📊" : "📝"}
                    &nbsp;{asn.file_name}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7h-2v7zM14 3v2h3.59L7.76 14.83l1.41 1.41L19 5.41V9h2V3h-7z"/>
                    </svg>
                  </a>
                )}

                {/* Progress bar */}
                <div style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{color:"#94a3b8",fontSize:12}}>Your Progress</span>
                    <span style={{color:"#f1f5f9",fontSize:12,fontWeight:700}}>{asn.progress||0}%</span>
                  </div>
                  <div style={{background:"#1e2535",borderRadius:6,height:8}}>
                    <div style={{
                      width:`${asn.progress||0}%`,
                      background:"linear-gradient(90deg,#3b82f6,#10b981)",
                      borderRadius:6,height:8,transition:"width 0.4s"
                    }}/>
                  </div>
                </div>

                {/* Progress slider (student can drag) */}
                {asn.status !== "completed" && (
                  <div style={{marginBottom:12}}>
                    <label style={{color:"#64748b",fontSize:12,display:"block",marginBottom:4}}>
                      Update your progress:
                    </label>
                    <input type="range" min={0} max={100} step={5}
                      defaultValue={asn.progress||0}
                      onMouseUp={e  => updateProgress(asn.assignment_id, Number(e.target.value), Number(e.target.value)===100?"completed":"in_progress")}
                      onTouchEnd={e => updateProgress(asn.assignment_id, Number(e.target.value), Number(e.target.value)===100?"completed":"in_progress")}
                      style={{width:"100%",accentColor:"#3b82f6"}}
                    />
                  </div>
                )}

                {/* Action buttons */}
                <div style={{display:"flex",gap:8}}>
                  {asn.status === "assigned" && (
                    <button onClick={()=>startTask(asn.assignment_id)} disabled={isUpdating}
                      style={{
                        flex:1,padding:"9px",background:"#3b82f622",border:"1px solid #3b82f644",
                        borderRadius:8,color:"#3b82f6",fontWeight:700,cursor:"pointer",fontSize:13
                      }}>
                      {isUpdating ? "…" : "▶ Start Task"}
                    </button>
                  )}
                  {asn.status !== "completed" && (
                    <button onClick={()=>markDone(asn.assignment_id)} disabled={isUpdating}
                      style={{
                        flex:2,padding:"9px",
                        background:"linear-gradient(135deg,#10b981,#059669)",
                        border:"none",borderRadius:8,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13
                      }}>
                      {isUpdating ? "Saving…" : "✅ Mark as Completed"}
                    </button>
                  )}
                  {asn.status === "completed" && (
                    <div style={{flex:1,padding:"9px",background:"#10b98122",border:"1px solid #10b98144",
                      borderRadius:8,color:"#10b981",fontWeight:700,fontSize:13,textAlign:"center"}}>
                      ✅ Completed {asn.completed_at ? `on ${new Date(asn.completed_at).toLocaleDateString()}` : ""}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}