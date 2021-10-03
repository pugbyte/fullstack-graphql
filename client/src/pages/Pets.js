import React, { useState } from "react";
import gql from "graphql-tag";
import { useQuery, useMutation } from "@apollo/react-hooks";
import PetsList from "../components/PetsList";
import NewPetModal from "../components/NewPetModal";
import Loader from "../components/Loader";

const PETS_FIELDS = gql`
  fragment PetsFields on Pet {
    id
    name
    type
    img
    owner {
      id
      age @client
    }
  }
`;

const ALL_PETS = gql`
  query AllPets {
    pets {
      ...PetsFields
    }
  }
  ${PETS_FIELDS}
`;

const ADD_PET = gql`
  mutation AddPet($newPet: NewPetInput!) {
    addPet(input: $newPet) {
      ...PetsFields
    }
  }
  ${PETS_FIELDS}
`;

export default function Pets() {
  const [modal, setModal] = useState(false);
  const { data, loading, error } = useQuery(ALL_PETS);
  const [addPet, newPet] = useMutation(ADD_PET, {
    update(cache, { data: { addPet } }) {
      const { pets } = cache.readQuery({ query: ALL_PETS });
      cache.writeQuery({ query: ALL_PETS, data: { pets: [addPet, ...pets] } });
    },
  });

  const onSubmit = (input) => {
    setModal(false);
    addPet({
      variables: { newPet: { name: input.name, type: input.type } },
      optimisticResponse: {
        __typename: "Mutation",
        addPet: {
          __typename: "Pet",
          name: input.name,
          type: input.type,
          id: Math.floor(Math.random() * 1000).toString(),
          img: "https://via.placeholder.com/300",
        },
      },
    });
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <p>Error loading pets: {error.message}</p>;
  }

  if (newPet.error) {
    return <p>Error loading pets: {newPet.error.message}</p>;
  }

  if (modal) {
    return <NewPetModal onSubmit={onSubmit} onCancel={() => setModal(false)} />;
  }

  return (
    <div className="page pets-page">
      <section>
        <div className="row betwee-xs middle-xs">
          <div className="col-xs-10">
            <h1>Pets</h1>
          </div>

          <div className="col-xs-2">
            <button onClick={() => setModal(true)}>new pet</button>
          </div>
        </div>
      </section>
      <section>
        <PetsList pets={data.pets} />
      </section>
    </div>
  );
}
