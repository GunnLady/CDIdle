import type { CityBuildingView } from "../../domain/cityPresentation";
import habitationCardImage from "../../assets/images/ui/buildings/building-card-habitation-v1.jpg";
import farmCardImage from "../../assets/images/ui/buildings/building-card-ferme-v1.jpg";
import woodcutterCardImage from "../../assets/images/ui/buildings/building-card-scierie-v1.jpg";
import quarryCardImage from "../../assets/images/ui/buildings/building-card-carriere-v1.jpg";
import mineCardImage from "../../assets/images/ui/buildings/building-card-mine-v1.jpg";
import chiefHouseCardImage from "../../assets/images/ui/buildings/building-card-maison-chef-v1.jpg";
import campCardImage from "../../assets/images/ui/buildings/building-card-guilde-v1.jpg";
import churchCardImage from "../../assets/images/ui/buildings/building-card-temple-v1.jpg";
import barracksCardImage from "../../assets/images/ui/buildings/building-card-caserne-v1.jpg";
import huntingPostCardImage from "../../assets/images/ui/buildings/building-card-poste-chasse-v1.jpg";
import arcaneWorkshopCardImage from "../../assets/images/ui/buildings/building-card-academie-v1.jpg";
import druidCircleCardImage from "../../assets/images/ui/buildings/building-card-cercle-v1.jpg";
import hideoutCardImage from "../../assets/images/ui/buildings/building-card-lair-v1.jpg";
import forgeCardImage from "../../assets/images/ui/buildings/building-card-forge-v1.jpg";
import habitationDetailImage from "../../assets/images/ui/buildings/building-detail-habitation-v1.jpg";
import farmDetailImage from "../../assets/images/ui/buildings/building-detail-ferme-v1.jpg";
import woodcutterDetailImage from "../../assets/images/ui/buildings/building-detail-scierie-v1.jpg";
import quarryDetailImage from "../../assets/images/ui/buildings/building-detail-carriere-v1.jpg";
import mineDetailImage from "../../assets/images/ui/buildings/building-detail-mine-v1.jpg";
import chiefHouseDetailImage from "../../assets/images/ui/buildings/building-detail-maison-chef-v1.jpg";
import campDetailImage from "../../assets/images/ui/buildings/building-detail-guilde-v1.jpg";
import churchDetailImage from "../../assets/images/ui/buildings/building-detail-temple-v1.jpg";
import barracksDetailImage from "../../assets/images/ui/buildings/building-detail-caserne-v1.jpg";
import huntingPostDetailImage from "../../assets/images/ui/buildings/building-detail-poste-chasse-v1.jpg";
import arcaneWorkshopDetailImage from "../../assets/images/ui/buildings/building-detail-academie-v1.jpg";
import druidCircleDetailImage from "../../assets/images/ui/buildings/building-detail-cercle-v1.jpg";
import hideoutDetailImage from "../../assets/images/ui/buildings/building-detail-lair-v1.jpg";
import forgeDetailImage from "../../assets/images/ui/buildings/building-detail-forge-v1.jpg";

export const buildingCardImages: Partial<Record<CityBuildingView["id"], string>> = {
  habitation: habitationCardImage,
  ferme: farmCardImage,
  scierie: woodcutterCardImage,
  carriere: quarryCardImage,
  mine: mineCardImage,
  maison_chef: chiefHouseCardImage,
  guilde: campCardImage,
  temple: churchCardImage,
  caserne: barracksCardImage,
  poste_chasse: huntingPostCardImage,
  academie: arcaneWorkshopCardImage,
  cercle: druidCircleCardImage,
  lair: hideoutCardImage,
  forge: forgeCardImage,
};

export const buildingDetailImages: Partial<Record<CityBuildingView["id"], string>> = {
  habitation: habitationDetailImage,
  ferme: farmDetailImage,
  scierie: woodcutterDetailImage,
  carriere: quarryDetailImage,
  mine: mineDetailImage,
  maison_chef: chiefHouseDetailImage,
  guilde: campDetailImage,
  temple: churchDetailImage,
  caserne: barracksDetailImage,
  poste_chasse: huntingPostDetailImage,
  academie: arcaneWorkshopDetailImage,
  cercle: druidCircleDetailImage,
  lair: hideoutDetailImage,
  forge: forgeDetailImage,
};
