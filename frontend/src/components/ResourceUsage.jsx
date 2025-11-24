import './ResourceUsage.css';

function ResourceUsage({ usage }) {
  const formatPercentage = (used, limit) => {
    const usedNum = parseFloat(used);
    const limitNum = parseFloat(limit);
    if (limitNum === 0) return 0;
    return Math.round((usedNum / limitNum) * 100);
  };

  return (
    <div className="card resource-usage">
      <h3>Resource Usage</h3>
      <div className="usage-grid">
        <div className="usage-item">
          <div className="usage-label">CPU</div>
          <div className="usage-bar">
            <div
              className="usage-fill"
              style={{
                width: `${formatPercentage(usage.cpu.used, usage.cpu.limit)}%`,
              }}
            />
          </div>
          <div className="usage-text">
            {usage.cpu.used} / {usage.cpu.limit} {usage.cpu.unit}
          </div>
        </div>
        <div className="usage-item">
          <div className="usage-label">Memory</div>
          <div className="usage-bar">
            <div
              className="usage-fill"
              style={{
                width: `${formatPercentage(usage.memory.used, usage.memory.limit)}%`,
              }}
            />
          </div>
          <div className="usage-text">
            {usage.memory.used} / {usage.memory.limit} {usage.memory.unit}
          </div>
        </div>
        <div className="usage-item">
          <div className="usage-label">Storage</div>
          <div className="usage-bar">
            <div className="usage-fill" style={{ width: '45%' }} />
          </div>
          <div className="usage-text">
            {usage.storage.used} / {usage.storage.limit}
          </div>
        </div>
        <div className="usage-item">
          <div className="usage-label">Pods</div>
          <div className="usage-bar">
            <div
              className="usage-fill"
              style={{
                width: `${formatPercentage(usage.pods.used, usage.pods.limit)}%`,
              }}
            />
          </div>
          <div className="usage-text">
            {usage.pods.used} / {usage.pods.limit}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResourceUsage;

