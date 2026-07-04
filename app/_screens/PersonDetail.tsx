import { PersonDetailView } from "@/components/tracker/PersonDetailView";
import { useLocalSearchParams } from "expo-router";
import React from "react";

const PersonDetailScreen = () => {
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id ? Number(params.id) : undefined;

  if (!id) return null;

  return <PersonDetailView personId={id} />;
};

export default PersonDetailScreen;
