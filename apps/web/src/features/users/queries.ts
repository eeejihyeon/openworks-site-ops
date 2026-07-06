import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { departmentsApi, usersApi } from "./api";
import type { UserFormValues } from "./schema";

export const usersKeys = {
  all: ["users"] as const,
};

export const departmentsKeys = {
  all: ["departments"] as const,
};

export function useUsers() {
  return useQuery({
    queryKey: usersKeys.all,
    queryFn: usersApi.list,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: UserFormValues) => usersApi.create(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: usersKeys.all }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: UserFormValues }) =>
      usersApi.update(id, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: usersKeys.all }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: usersKeys.all }),
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: departmentsKeys.all,
    queryFn: departmentsApi.list,
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => departmentsApi.create(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: departmentsKeys.all }),
  });
}

export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => departmentsApi.update(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: departmentsKeys.all }),
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => departmentsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: departmentsKeys.all }),
  });
}
