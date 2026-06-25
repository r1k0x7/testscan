// ... (keep existing imports and types)

// Add this helper at top
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
};

// Inside component, add:
const isMobile = useIsMobile();

// Update the Stats Grid section:
<div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
  <StatBox label="Account Value" value={...} color="cyan" />
  <StatBox label="Margin Used" value={...} color="blue" />
  <StatBox label="Positions" value={...} color="emerald" />
  <StatBox label="Total Txs" value={...} color="purple" />
</div>

// Update Positions tab table to be scrollable:
<div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
  <table className="w-full text-sm min-w-[640px]">
    {/* ... existing table */}
  </table>
</div>

// Update History tab table similarly:
<div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
  <table className="w-full text-sm min-w-[500px]">
    {/* ... existing table */}
  </table>
</div>
