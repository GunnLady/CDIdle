import { BookOpen, Church, EyeOff, Flame, Grape, Hammer, Heart, Home, Leaf, Pickaxe, ShieldAlert, Store, Swords, Target, Trees } from "lucide-react";

export function CityIcon({ name, className = "w-5 h-5 text-[#caa050]" }: { name: string; className?: string }) {
  const props = { className };
  switch (name) {
    case "Grape": return <Grape {...props} />; case "Trees": return <Trees {...props} />;
    case "Hammer": return <Hammer {...props} />; case "Pickaxe": return <Pickaxe {...props} />;
    case "Store": return <Store {...props} />; case "ShieldAlert": return <ShieldAlert {...props} />;
    case "BookOpen": return <BookOpen {...props} />; case "Heart": return <Heart {...props} />;
    case "Church": return <Church {...props} />; case "Swords": return <Swords {...props} />;
    case "Target": return <Target {...props} />; case "Leaf": return <Leaf {...props} />;
    case "EyeOff": return <EyeOff {...props} />; case "Flame": return <Flame {...props} />;
    default: return <Home {...props} />;
  }
}
