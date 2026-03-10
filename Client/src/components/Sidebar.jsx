import Client from "./Client";

function Sidebar({
  clients = [],
  role,
  promote,
  requestPromotion,
  copyRoomId,
  leaveRoom
}) {

  const grouped = groupClientsByRole(clients);

  return (
    <div style={styles.aside}>

      <div style={styles.logoWrap}>
        <img
          style={styles.logoImg}
          src="/code-sync-logo.png"
          alt="code-sync-logo"
        />
      </div>

      <div style={styles.divider} />

      <div style={styles.scrollArea}>

        {/* Host */}
        <p style={styles.sectionLabel}>Host</p>
        <div style={styles.clientsList}>
          {grouped.host.map(client => (
            <Client
              key={client.socketId}
              client={client}
              promote={promote}
            />
          ))}
        </div>

        <div style={styles.divider} />

        {/* Editors */}
        <p style={styles.sectionLabel}>Editors</p>
        <div style={styles.clientsList}>
          {grouped.editor.length ? (
            grouped.editor.map(client => (
              <Client
                key={client.socketId}
                client={client}
                promote={promote}
              />
            ))
          ) : (
            <small style={styles.empty}>No editors connected.</small>
          )}
        </div>

        <div style={styles.divider} />

        {/* Requests */}
        <p style={styles.sectionLabel}>Requests</p>
        <div style={styles.clientsList}>
          {grouped.pending.length ? (
            grouped.pending.map(client => (
              <Client
                key={client.socketId}
                client={client}
                promote={promote}
              />
            ))
          ) : (
            <small style={styles.empty}>No requests yet.</small>
          )}
        </div>

      </div>

      <div style={styles.btnGroup}>

        {role === "host" && (
          <button style={styles.copyBtn} onClick={() => {
            copyRoomId?.()
          }}>
            Copy ROOM ID
          </button>
        )}

        {role === "viewer" && (
          <button style={styles.copyBtn} onClick={() => {
            console.log("Requesting promotion...");
            requestPromotion?.()
          }}>
            Request Promotion
          </button>
        )}

        <button style={styles.leaveBtn} onClick={() => {
          console.log("Leaving room...");
          leaveRoom?.();
        }}>
          Leave
        </button>

      </div>

    </div>
  );
}

const groupClientsByRole = (clients = []) => {
  return clients.reduce(
    (acc, client) => {
      const role = client?.role?.toLowerCase();

      if (role === "host") acc.host.push(client);
      else if (role === "editor") acc.editor.push(client);
      else if (role === "pending") acc.pending.push(client);

      return acc;
    },
    { host: [], editor: [], pending: [] }
  );
};

const styles = {
  aside: {
    width: "220px",
    flexShrink: 0,
    height: "100vh",
    backgroundColor: "#1e2730",
    borderRight: "1px solid #2e3d4f",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },

  logoWrap: {
    padding: "18px 16px 14px",
    flexShrink: 0,
  },

  logoImg: {
    width: "100%",
    maxWidth: "160px",
    display: "block",
  },

  divider: {
    height: "1px",
    background: "#2e3d4f",
    margin: "0 16px",
    flexShrink: 0,
  },

  scrollArea: {
    flex: 1,
    overflowY: "auto",
    padding: "8px 0",
    scrollbarWidth: "thin",
    scrollbarColor: "#2e3d4f transparent",
  },

  sectionLabel: {
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "1.2px",
    textTransform: "uppercase",
    color: "#4ade80",
    padding: "12px 18px 6px",
    margin: 0,
  },

  clientsList: {
    padding: "0 12px 8px",
  },

  empty: {
    display: "block",
    textAlign: "center",
    color: "#4a5568",
    fontSize: "12px",
    padding: "4px 0 8px",
  },

  btnGroup: {
    padding: "12px 14px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flexShrink: 0,
    borderTop: "1px solid #2e3d4f",
  },

  copyBtn: {
    width: "100%",
    padding: "10px 0",
    borderRadius: "8px",
    border: "1px solid #4ade80",
    background: "transparent",
    color: "#e2e8f0",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: "0.3px",
    transition: "background 0.2s, color 0.2s",
  },

  copyBtnHover: {
    background: "#4ade80",
    color: "#161c24",
  },

  leaveBtn: {
    width: "100%",
    padding: "10px 0",
    borderRadius: "8px",
    border: "none",
    background: "#4ade80",
    color: "#161c24",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "0.3px",
  },
};

export default Sidebar;